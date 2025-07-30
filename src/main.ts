import { Devvit } from '@devvit/public-api';

import { findMentionedIcaoCodes, makeCommentBody } from './util.js';

Devvit.configure({
  redditAPI: true,
});

Devvit.addTrigger({
  event: 'PostSubmit',
  onEvent: async (event, { reddit }) => {
    const postId = event.post?.id;
    if (!postId) {
      console.error('No post ID.');
      return;
    }

    const postTitle = event.post?.title;
    const postText = event.post?.selftext;
    const combinedText = [postTitle, postText].filter(Boolean).join('\n\n');

    const mentionedIcaoCodes = findMentionedIcaoCodes(combinedText);

    if (mentionedIcaoCodes.size === 0) {
      console.log('No ICAO codes mentioned in the post.');
      return;
    }

    console.log('==== POST TEXT ====');
    console.log(combinedText);
    console.log('===================');
    console.log('==== ICAO CODE ====');
    console.log(`${Array.from(mentionedIcaoCodes).join(', ')}`);
    console.log('===================');

    const commentBody = makeCommentBody(mentionedIcaoCodes);

    try {
      await reddit.submitComment({
        id: postId,
        text: commentBody,
      });
      console.log('Comment posted successfully!');
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  },
});

export default Devvit;
