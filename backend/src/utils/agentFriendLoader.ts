import { Agent } from '../agent';
import { formatFriendContextForLLM } from './friendContextFormatter';

export function loadFriendContextForAgent(agent: Agent, friendId: string): void {
  const context = formatFriendContextForLLM(friendId);
  agent.setFriendContext(context);
}
