import "./chatList.css";
import { useState, useEffect } from "react";
import AddUser from "./addUser/AddUser";
import { useUserStore } from "../../../lib/userStore";
import { onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";

const ChatList = () => {
  const [addMode, setAddMode] = useState(false);
  const [chats, setChats] = useState([]);
  const [input, setInput] = useState("");

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  useEffect(() => {
    if (!currentUser?.id) {
      console.error("No currentUser or user ID found");
      return;
    }

    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (res) => {
        try {
          const data = res.data();

          if (!data?.chats || !Array.isArray(data.chats)) {
            console.warn("Chats not found or invalid structure");
            setChats([]);
            return;
          }

          const items = data.chats;

          const promises = items.map(async (item) => {
            if (!item?.receiverId || !item?.chatId) {
              console.warn("Missing receiverId or chatId in chat item", item);
              return null;
            }

            try {
              const userDocRef = doc(db, "users", item.receiverId);
              const userDocSnap = await getDoc(userDocRef);

              if (!userDocSnap.exists()) {
                console.warn(
                  `User document not found for ID: ${item.receiverId}`
                );
                return { ...item, user: null };
              }

              const user = userDocSnap.data();
              return { ...item, user, chatId: item.chatId };
            } catch (error) {
              console.error("Error fetching user document:", error);
              return null;
            }
          });

          const chatData = await Promise.all(promises);

          // Filter out invalid items
          const validChats = chatData.filter(Boolean);
          setChats(validChats.sort((a, b) => b.updatedAt - a.updatedAt));
        } catch (error) {
          console.error("Error processing snapshot data:", error);
        }
      },
      (error) => {
        console.error("Error in Firestore snapshot listener:", error);
      }
    );

    return () => {
      unSub();
    };
  }, [currentUser?.id]);

  // Hardcoded chat items
  const hardcodedChats = [
    {
      user: { avatar: "./simone.jpg", username: "Simone" },
      lastMessage: "Please check your emails dude",
    },
    {
      user: { avatar: "./priyanka.jpg", username: "Priyanka" },
      lastMessage: "Hey, can we meet tomorrow at 10am?",
    },
    {
      user: { avatar: "./polly.jpg", username: "Polly" },
      lastMessage: "Bye! <3",
    },
    {
      user: { avatar: "./ayanda.jpg", username: "Ayanda" },
      lastMessage: "I can't wait to see you again sis :-)",
    },
    {
      user: { avatar: "./lauren.jpg", username: "Lauren" },
      lastMessage: "Do you remember that time we jumped into the pool from the roof? :-D",
    },
    {
      user: { avatar: "./lisa.jpg", username: "Lisa" },
      lastMessage: "I sent Jacob a message but he hasn't gotten back to me yet :(",
    },
  ];

  const handleSelect = async (chat) => {
    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex(
      (item) => item.chatId === chat.chatId
    );

    userChats[chatIndex].isSeen = true;

    const userChatsRef = doc(db, "userchats", currentUser.id);

    try {
      await updateDoc(userChatsRef, {
        chats: userChats,
      });
      changeChat(chat.chatId, chat.user);
    } catch (error) {
      console.log(error);
    }
  };

  const filteredChats = chats.filter(c=> c.user.username.toLowerCase().includes(input.toLowerCase()));

  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt=""
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>
      {/* Render dynamic chats */}
      {filteredChats.map((chat, index) => (
        <div
          className="item"
          key={chat.chatId}
          onClick={() => handleSelect(chat)}
          style={{
            backgroundColor: chat?.isSeen ? "transparent" : "#5183fe",
          }}
        >
          <img
            src={
              chat.user.blocked.includes(currentUser.id)
                ? "/avatar-login.jpg"
                : chat.user?.avatar || "./login-avatar.jpg"
            }
            alt=""
          />
          <div className="texts">
            <span>
              {chat.user.blocked.includes(currentUser.id)
                ? "User"
                : chat.user?.username}
            </span>
            <p>{chat.lastMessage}</p>
          </div>
        </div>
      ))}

      {/* Render hardcoded chats */}
      {hardcodedChats.map((chat, index) => (
        <div className="item" key={`hardcoded-${index}`}>
          <img src={chat.user.avatar} alt="" />
          <div className="texts">
            <span>{chat.user.username}</span>
            <p>{chat.lastMessage}</p>
          </div>
        </div>
      ))}

      {addMode && <AddUser />}
    </div>
  );
};

export default ChatList;

//======================================================================
