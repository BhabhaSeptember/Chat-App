import { useState } from "react";
import { toast } from "react-toastify";
import "./login.css";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const Login = () => {
  const [avatar, setAvatar] = useState({
    file: null,
    url: "",
  });

  const [loading, setLoading] = useState(false);

  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  //============================ HANDLE REGISTER ============================
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const { username, email, password } = Object.fromEntries(formData);

    //Validations
    if (!username || !email || !password) {
      toast.warn("Please enter inputs!");
      setLoading(false);
      return;
    }

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      toast.warn("Select another username");
      setLoading(false);
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // await createUserWithEmailAndPassword(
      //   auth,
      //   "test@email.com",
      //   "testpassword"
      // );
      console.log("Registering: ", username, email);
      // Wait a bit to ensure auth state updated
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const user = auth.currentUser;
      if (!user) {
        toast.error("User authentication failed after registration.");
        setLoading(false);
        return;
      }
      //================================================================
      await setDoc(doc(db, "users", user.uid), {
        username,
        email,
        id: user.uid,
        blocked: [],
      });

      await setDoc(doc(db, "userchats", user.uid), {
        chats: [],
      });

      toast.success("Welcome to the Chat-App!");
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
    //================================================================
    //   await setDoc(doc(db, "users", res.user.uid), {
    //     username,
    //     email,
    //     id: res.user.uid,
    //     blocked: [],
    //   });

    //   await setDoc(doc(db, "userchats", res.user.uid), {
    //     chats: [],
    //   });
    //   toast.success("Welcome to the Chat-App!");
    // } catch (error) {
    //   console.log(error);
    //   toast.error(error.message);
    // } finally {
    //   setLoading(false);
    // }
  };

  //============================ HANDLE LOGIN ============================
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    try {
      console.log(email, password);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="item">
        <h2>Welcome back,</h2>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" name="email" />
          <input type="password" placeholder="Password" name="password" />
          <button disabled={loading}>
            {loading ? "Loading..." : "Sign In"}
          </button>
        </form>
      </div>
      <div className="separator"></div>
      <div className="item">
        <h2>Create an Account</h2>
        <form onSubmit={handleRegister}>
          <label htmlFor="file">
            <img src={avatar.url || "./login-avatar.jpg"} alt="" />
            Upload an image
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleAvatar}
          />
          <input type="text" placeholder="Username" name="username" />
          <input type="email" placeholder="Email" name="email" />
          <input type="password" placeholder="Password" name="password" />
          <button disabled={loading}>
            {loading ? "Loading..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
