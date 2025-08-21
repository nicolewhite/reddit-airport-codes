import { Devvit } from '@devvit/public-api';

import { APP_USERNAME, BAD_BOT_PHRASE, MY_USERNAME } from './data.js';
import { makeCommentResponse, getFalsePositiveCodes } from './util.js';

Devvit.configure({
  redditAPI: true,
  redis: true,
  http: {
    domains: ['raw.githubusercontent.com'],
  },
});

Devvit.addTrigger({
  event: 'PostSubmit',
  onEvent: async (event, { reddit, redis }) => {
    const postId = event.post?.id;
    if (!postId) {
      console.error('No post ID.');
      return;
    }

    const postTitle = event.post?.title;
    const postText = event.post?.selftext;
    const combinedText = [postTitle, postText].filter(Boolean).join('\n\n');

    const falsePositiveCodes = await getFalsePositiveCodes();

    const responseCommentBody = makeCommentResponse({
      text: combinedText,
      ignoreCodes: falsePositiveCodes,
      isReplyToPost: true,
    });

    if (!responseCommentBody) {
      return;
    }

    const didLeaveCommentKey = `commented:${postId}`;

    try {
      const didLeaveComment = await redis.get(didLeaveCommentKey);
      if (didLeaveComment) {
        console.warn(`Already commented on post '${postId}'. Skipping.`);
        return;
      }
    } catch (error) {
      // In the case of a Redis error, err on the side continuing
      // and potentially leaving a duplicate comment instead of no
      // comment at all.
      console.error(`Error getting key '${didLeaveCommentKey}' from Redis:`, error);
    }

    try {
      const comment = await reddit.submitComment({
        id: postId,
        text: responseCommentBody,
      });

      // Mark that we've commented on this post to avoid duplicate comments,
      // since there is no guarantee that the PostSubmit event will only fire
      // once per post.
      await redis.set(didLeaveCommentKey, '1', {
        // Set an expiration of 1 day so we don't keep this key forever.
        expiration: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      // Distinguish the comment as being from a mod and
      // sticky the comment to the top of the post.
      await comment.distinguish(true);
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  },
});

Devvit.addTrigger({
  event: 'CommentSubmit',
  onEvent: async (event, { reddit }) => {
    if (event.author?.name === APP_USERNAME) {
      // Don't reply to our own comments.
      return;
    }

    const postId = event.post?.id;
    const commentId = event.comment?.id;
    const commentBody = event.comment?.body;
    const commentParentId = event.comment?.parentId;

    if (!postId || !commentId || !commentParentId) {
      console.error('Missing ID:', { postId, commentId, commentParentId });
      return;
    }

    // The comment is a reply to another comment (as opposed to the post itself,
    // aka a top-level comment) if the parent ID is not the same as the post ID.
    const isReplyToAnotherComment = commentParentId !== postId;

    // Give the author of the post (and me) the ability to delete the bot's comment
    // by replying with "bad bot".
    if (
      isReplyToAnotherComment &&
      // commenter is the author of the post or me
      (event.author?.id === event.post?.authorId || event.author?.name === MY_USERNAME) &&
      // comment contains the bad bot key phrase
      commentBody?.toLowerCase().includes(BAD_BOT_PHRASE)
    ) {
      const parentComment = await reddit.getCommentById(commentParentId);

      // Only delete the parent comment if it's from us and is the top-level comment.
      if (parentComment.authorName === APP_USERNAME && parentComment.parentId === postId) {
        await parentComment.delete();
        return;
      }
    }

    if (!commentBody?.includes(`u/${APP_USERNAME}`)) {
      // Don't handle comments that don't mention us.
      return;
    }

    let textToParse = commentBody;

    if (isReplyToAnotherComment) {
      // If the comment is a reply to another comment, it's likely someone
      // wanting to know the airport codes mentioned in the parent comment.
      const parentComment = await reddit.getCommentById(commentParentId);

      // If the parent comment is not ours, include its body in the text to parse.
      if (parentComment.authorName !== APP_USERNAME) {
        textToParse = [commentBody, parentComment.body].filter(Boolean).join('\n\n');
      }
    }

    const falsePositiveCodes = await getFalsePositiveCodes();

    const responseCommentBody = makeCommentResponse({
      text: textToParse,
      ignoreCodes: falsePositiveCodes,
      isReplyToPost: false,
    });

    if (!responseCommentBody) {
      return;
    }

    try {
      const comment = await reddit.submitComment({
        id: commentId,
        text: responseCommentBody,
      });

      // Distinguish the comment as being from a mod
      // but do not sticky it.
      await comment.distinguish(false);
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  },
});

export default Devvit;
