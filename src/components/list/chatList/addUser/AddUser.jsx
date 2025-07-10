import "./addUser.css";
import { db } from "../../../../lib/firebase";
import {
  collection,
  getDoc,
  getDocs,
  doc,
  setDoc,
  query,
  serverTimestamp,
  where,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { useState } from "react";
import { useUserStore } from "../../../../lib/userStore";
import { getAuth } from "firebase/auth";

const AddUser = () => {
  const [user, setUser] = useState(null);

  const { currentUser } = useUserStore();

  //Handle Search
  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");

    try {
      const userRef = collection(db, "users");

      const q = query(userRef, where("username", "==", username));

      const querySnapShot = await getDocs(q);

      if (!querySnapShot.empty) {
        const docSnap = querySnapShot.docs[0];
        setUser({
          id: docSnap.id, //Attach the doc ID to the user object
          ...docSnap.data(),
        });
        // setUser(querySnapShot.docs[0].data());
      }
    } catch (error) {
      console.log(error);
    }
  };

  //Handle Add
  const handleAdd = async () => {
    const auth = getAuth();
    console.log("Current Firebase Auth user:", auth.currentUser);

    if (!auth.currentUser) {
      console.warn("User is not authenticated.");
      return;
    }

    const chatRef = collection(db, "chats");
    const userChatsRef = collection(db, "userchats");

    try {
      const newChatRef = doc(chatRef);
      console.log("Creating chat...");
      console.log("currentUser.id:", currentUser?.id);
      console.log("user.id:", user?.id);
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });
      console.log("Chat created: ", newChatRef.id);

      // Ensure userchats docs exist for both users
      const userChatDocRef = doc(userChatsRef, user.id);
      const currentUserChatDocRef = doc(userChatsRef, currentUser.id);

      const userChatsSnapshot = await getDoc(userChatDocRef);
      if (!userChatsSnapshot.exists()) {
        console.log("Creating user's userchat doc...");
        await setDoc(userChatDocRef, { chats: [] });
      }

      const currentUserChatsSnapshot = await getDoc(currentUserChatDocRef);
      if (!currentUserChatsSnapshot.exists()) {
        await setDoc(currentUserChatDocRef, { chats: [] });
      }

      // Update chat references for both users
      console.log("Updating both userchat docs...");
      await updateDoc(userChatDocRef, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          updatedAt: Date.now(),
        }),
      });

      await updateDoc(currentUserChatDocRef, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          updatedAt: Date.now(),
        }),
      });
    } catch (error) {
      console.error("Firestore write failed:", error);
    }
  };

  // const handleAdd = async () => {
  //   const chatRef = collection(db, "chats");
  //   const userChatsRef = collection(db, "userchats");

  //   try {
  //     // Create a new chat document
  //     const newChatRef = doc(chatRef);
  //     console.log("Current user: ", auth.currentUser);
  //     await setDoc(newChatRef, {
  //       createdAt: serverTimestamp(),
  //       messages: []
  //     });

  //     // Check if the userchats document exists for the user
  //     const userChatsSnapshot = await getDoc(doc(userChatsRef, user.id));
  //     if (!userChatsSnapshot.exists()) {
  //       // If the document doesn't exist, create it
  //       await setDoc(doc(userChatsRef, user.id), {
  //         chats: [],
  //       });
  //     }

  //     // Check if the userchats document exists for the current user
  //     const currentUserChatsSnapshot = await getDoc(doc(userChatsRef, currentUser.id));
  //     if (!currentUserChatsSnapshot.exists()) {
  //       // If the document doesn't exist, create it
  //       await setDoc(doc(userChatsRef, currentUser.id), {
  //         chats: [],
  //       });
  //     }

  //     // Update both userchats documents
  //     await updateDoc(doc(userChatsRef, user.id), {
  //       chats: arrayUnion({
  //         chatId: newChatRef.id,
  //         lastMessage: "",
  //         receiverId: currentUser.id,
  //         updatedAt: Date.now()
  //       }),
  //     });
  //     await updateDoc(doc(userChatsRef, currentUser.id), {
  //       chats: arrayUnion({
  //         chatId: newChatRef.id,
  //         lastMessage: "",
  //         receiverId: user.id,
  //         updatedAt: Date.now()
  //       }),
  //     });
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" />
        <button>Search</button>
      </form>
      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || "./login-avatar.jpg"} alt="" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>Add User</button>
        </div>
      )}
    </div>
  );
};
export default AddUser;
