// ...imports
import ConversationHeader from '../components/ConversationHeader';
// ...rest of imports remain

// inside return where selectedConversation is truthy, replace top header div
{/* Chat Header */}
<ConversationHeader title={getOtherParticipant(selectedConversation).username} encrypted={!!selectedConversation.encryption?.enabled} />
