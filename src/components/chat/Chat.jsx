import { useEffect, useState, useRef } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";

const Chat = () => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [chat, setChat] = useState();
  const [editingMessage, setEditingMessage] = useState(null);

  // const { chatId } = useChatStore;
  const chatId = useChatStore((state) => state.chatId);
  const user = useChatStore((state) => state.user);
  const isCurrentUserBlocked = useChatStore(
    (state) => state.isCurrentUserBlocked
  );
  const isReceiverBlocked = useChatStore((state) => state.isReceiverBlocked);
  const currentUser = useUserStore((state) => state.currentUser);

  //allow user to auto scroll to the latest messages in a chat upon page refresh
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!chatId) {
      console.error("No chatId provided");
      return;
    }

    const unSub = onSnapshot(
      doc(db, "chats", chatId), // Ensure chatId maps to a document in "chats"
      (res) => {
        if (res.exists()) {
          setChat(res.data());
        } else {
          console.error("Chat document does not exist for chatId:", chatId);
        }
      },
      (error) => console.error("Error fetching chat:", error)
    );

    return () => {
      unSub();
    };
  }, [chatId]);

  useEffect(() => {
    // Reset chat when the currentUser changes (indicating login)
    setChat(null);
  }, [currentUser]);

  //   const unSub = onSnapshot(
  //     doc(db, "chats", chatId), (res) => {
  //     setChat(res.data());
  //   });

  //   return () => {
  //     unSub();
  //   };
  // }, [chatId]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleSend = async () => {
    if (text === "") return;

    if (editingMessage) {
      await handleUpdateMessage();
      return;
    }

    try {
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text,
          createdAt: new Date(),
        }),
      });

      const userIDs = [currentUser.id, user.id];

      userIDs.forEach(async (id) => {
        const userChatsRef = doc(db, "userchats", id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();

          const chatIndex = userChatsData.chats.findIndex(
            (c) => c.chatId === chatId
          );

          userChatsData.chats[chatIndex].lastMessage = text;
          userChatsData.chats[chatIndex].isSeen =
            id === currentUser.id ? true : false;
          userChatsData.chats[chatIndex].updatedAt = Date.now();

          await updateDoc(userChatsRef, {
            chats: userChatsData.chats,
          });
        }
      });
      setText("");
    } catch (error) {
      console.log(error);
    }
  };

  // Function to handle editing
  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setText(message.text); // Set the text input to the message being edited
  };

  // Function to update the message in Firestore
  const handleUpdateMessage = async () => {
    if (!editingMessage) return;

    try {
      const updatedMessages = chat.messages.map((msg) =>
        msg.createdAt === editingMessage.createdAt ? { ...msg, text } : msg
      );

      await updateDoc(doc(db, "chats", chatId), {
        messages: updatedMessages,
      });

      setEditingMessage(null);
      setText("");
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setText("");
  };

  const handleDeleteMessage = async (message) => {
    try {
      const updatedMessages = chat.messages.filter(
        (msg) => msg.createdAt !== message.createdAt
      );

      await updateDoc(doc(db, "chats", chatId), {
        messages: updatedMessages,
      });
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  return (
    <div className="chat">
      {/* ============================= TOP SECTION =============================*/}
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./login-avatar.jpg"} alt="" />
          <div className="texts">
            <span>{user?.username}</span>
            <p>
              <span className="status"></span>
              <i>Online</i>
            </p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="" />
          <img src="./video.png" alt="" />
          <img src="./info.png" alt="" />
        </div>
      </div>
      {/* ============================= CENTER SECTION =============================*/}

      <div className="center">
        {chat?.messages?.map((message) => (
          <div
            className={
              message.senderId === currentUser?.id ? "message-own" : "message"
            }
            key={message?.createdAt}
          >
            <div className="texts">
              {message.img && (
                <img src={message.img || "./busy-office-image.png"} alt="" />
              )}
              <p>{message.text}</p>
              <span>2 min ago</span>
              {message.senderId === currentUser.id && (
        <div className="actions">
          <button onClick={() => handleEditMessage(message)}>Edit</button>
          <button onClick={() => handleDeleteMessage(message)}>Delete</button>
        </div>
      )}
            </div>
          </div>
        ))}

        {/* <div className="message">
          <img src="./avatar.jpg" alt="" />
          <div className="texts">
            <p>Awesome! Enjoy the rest of your day. Bye!!</p>
            <span>1 min ago</span>
          </div>
        </div> */}

        <div ref={endRef}></div>
      </div>

      {/* //---------------- */}

      {/* <div className="center">
        {chat?.messages?.map((message) => (
          <div
            className={
              message.senderId === currentUser?.id ? "message-own" : "message"
            }
            key={message?.createdAt}
          >
            <div className="texts">
              {message.img && (
                <img src={message.img || "./busy-office-image.png"} alt="" />
              )}
              <p>{message.text}</p>
              <div className="actions">
                {message.senderId === currentUser.id && (
                  <>
                    <img
                      src="./edit-icon.png"
                      alt="Edit"
                      onClick={() => handleEditMessage(message)}
                    />
                    <img
                      src="./delete-icon.png"
                      alt="Delete"
                      onClick={() => handleDeleteMessage(message)}
                    />
                  </>
                )}
              </div>

              <span>2 min ago</span>
            </div>
          </div>
        ))}
        <div ref={endRef}></div>
      </div> */}

      {/* ============================= BOTTOM SECTION =============================*/}

      <div className="bottom">
        <div className="icons">
          <img src="./img.png" alt="" />
          <img src="./camera.png" alt="" />
          <img src="./mic.png" alt="" />
        </div>
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "You cannot send this user a message!"
              : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />

          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>

        {editingMessage ? (
          <div>
            <button className="sendButton" onClick={handleUpdateMessage}>
              Update
            </button>
            <button onClick={handleCancelEdit}>Cancel</button>
          </div>
        ) : (
          <button
            className="sendButton"
            onClick={handleSend}
            disabled={isCurrentUserBlocked || isReceiverBlocked}
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
};
export default Chat;
