import { friendService } from '../services/friendService';

export function formatFriendContextForLLM(friendId: string): string {
  const friend = friendService.getById(friendId);
  if (!friend) {
    return 'No friend data found.';
  }

  let context = `Friend Profile: ${friend.name}\n`;
  context += `Relationship: ${friend.relationship}\n`;
  context += `Birthday: ${friend.birthday}\n\n`;

  // Format likes
  if (friend.likes.length > 0) {
    context += `LIKES:\n`;
    friend.likes.forEach((cat: any) => {
      context += `  - ${cat.name}:\n`;
      cat.items?.forEach((item: any) => {
        context += `    ${item.rank}. ${item.name}`;
        if (item.description) context += ` - ${item.description}`;
        if (item.tags?.length) context += ` (tags: ${item.tags.join(', ')})`;
        context += '\n';
      });
    });
    context += '\n';
  }

  // Format dislikes
  if (friend.dislikes.length > 0) {
    context += `DISLIKES:\n`;
    friend.dislikes.forEach((cat: any) => {
      context += `  - ${cat.name}:\n`;
      cat.items?.forEach((item: any) => {
        context += `    - ${item.name}`;
        if (item.description) context += ` - ${item.description}`;
        context += '\n';
      });
    });
    context += '\n';
  }

  // Format notes
  if (friend.notes.length > 0) {
    context += `NOTES:\n`;
    friend.notes.forEach((note: any) => {
      context += `  [${note.category}] ${note.content}\n`;
    });
    context += '\n';
  }

  // Format important dates
  if (friend.importantDates.length > 0) {
    context += `IMPORTANT DATES:\n`;
    friend.importantDates.forEach((date: any) => {
      context += `  - ${date.name} (${date.date}) - ${date.type}`;
      if (date.giftIdeas?.length) context += ` - Gift ideas: ${date.giftIdeas.join(', ')}`;
      context += '\n';
    });
  }

  return context;
}
