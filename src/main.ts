import { Devvit, SettingScope } from '@devvit/public-api';

import { APP_USERNAME, FALSE_POSITIVES_LIST_SETTING_NAME } from './data.js';
import { makeCommentResponse, getFalsePositiveCodes } from './util.js';

Devvit.configure({
  redditAPI: true,
});

Devvit.addSettings([
  {
    type: 'string',
    name: FALSE_POSITIVES_LIST_SETTING_NAME,
    label: 'Comma-separated list of codes that often return false positives.',
    scope: SettingScope.App,
  },
]);

Devvit.addTrigger({
  event: 'PostSubmit',
  onEvent: async (event, { reddit, settings }) => {
    const postId = event.post?.id;
    if (!postId) {
      console.error('No post ID.');
      return;
    }

    const postTitle = event.post?.title;
    const postText = event.post?.selftext;
    const combinedText = [postTitle, postText].filter(Boolean).join('\n\n');

    const falsePositiveCodes = await getFalsePositiveCodes(settings);

    const responseCommentBody = makeCommentResponse({
      text: combinedText,
      ignoreCodes: falsePositiveCodes,
    });

    if (!responseCommentBody) {
      return;
    }

    try {
      const comment = await reddit.submitComment({
        id: postId,
        text: responseCommentBody,
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
  onEvent: async (event, { reddit, settings }) => {
    if (event.author?.name === APP_USERNAME) {
      // Don't reply to our own comments.
      return;
    }

    const commentBody = event.comment?.body;

    if (!commentBody?.includes(`u/${APP_USERNAME}`)) {
      // Don't handle comments that don't mention us.
      return;
    }

    const postId = event.post?.id;
    const commentId = event.comment?.id;
    const commentParentId = event.comment?.parentId;

    if (!postId || !commentId || !commentParentId) {
      console.error('Missing ID:', { postId, commentId, commentParentId });
      return;
    }

    let textToParse = commentBody;

    if (commentParentId !== postId) {
      // If the comment is a reply to another comment, it's likely someone
      // wanting to know the airport codes mentioned in the parent comment.
      const parentComment = await reddit.getCommentById(commentParentId);

      // If the parent comment is not ours, include its body in the text to parse.
      if (parentComment.authorName !== APP_USERNAME) {
        textToParse = [commentBody, parentComment.body].filter(Boolean).join('\n\n');
      }
    }

    const falsePositiveCodes = await getFalsePositiveCodes(settings);

    const responseCommentBody = makeCommentResponse({
      text: textToParse,
      ignoreCodes: falsePositiveCodes,
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
