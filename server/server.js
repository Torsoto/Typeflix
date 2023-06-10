import express from "express";
import {
  getAuth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
} from "firebase/firestore";
import "./db/firebase.mjs";
import cors from "cors";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const app = express();
const auth = getAuth();
const db = getFirestore();
const secretKey = crypto.randomBytes(64).toString("hex");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "http://localhost:5173" }));

app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const lowercaseUsername = username.toLowerCase();

    const userDoc = await getDocs(collection(db, "users"));
    let usernameExists = false;

    userDoc.forEach((doc) => {
      if (doc.data().username === lowercaseUsername) {
        usernameExists = true;
      }
    });

    if (usernameExists) {
      console.log("Username already exists");
      res.status(401).send({ error: "Username already exists" });
    } else {
      try {
        const { username, email, password } = req.body;
        createUserWithEmailAndPassword(auth, email, password)
          .then((userRecord) => {
            console.log("Successfully created new user:", userRecord.user.uid);

            setDoc(doc(db, "users", lowercaseUsername), {
              username: lowercaseUsername,
              email: email,
              userid: userRecord.user.uid,
              friends: [],
            })
              .then(() => {
                console.log("User data stored in Firestore");

                const payload = {
                  uid: userRecord.user.uid,
                  username: lowercaseUsername,
                  email: email,
                };

                const token = jwt.sign(payload, secretKey, {
                  expiresIn: "336h",
                });

                res
                  .status(200)
                  .send({ token: token, uid: userRecord.user.uid });
              })
              .catch((error) => {
                console.log("Error storing user data in Firestore:", error);
                res.status(500).send({ error: error.message });
              });
          })
          .catch((error) => {
            console.log("Error creating new user:", error);
            res.status(500).send({ error: error.message });
          });
      } catch (e) {
        res.status(500).send({ error: e.message });
      }
    }
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.post("/login", async (req, res) => {
  const { identifier, password } = req.body;
  const lowercaseIdentifier = identifier.toLowerCase();

  // First, attempt to find the user by username.
  const userDoc = await getDocs(collection(db, "users"));
  let email;

  userDoc.forEach((doc) => {
    if (doc.data().username === lowercaseIdentifier) {
      email = doc.data().email;
    }
  });

  if (email) {
    // User found by username, attempt to sign in with their email.
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("User logged in successfully");

        const payload = {
          uid: userCredential.user.uid,
          username: lowercaseIdentifier,
          email: email,
        };

        const token = jwt.sign(payload, secretKey, { expiresIn: "336h" });

        res.status(200).send({ token: token, uid: userCredential.user.uid });
      })
      .catch((error) => {
        console.error("Error:", error.message);
        console.error(email, password);
        res.status(400).send({ error: error.message });
      });
  } else {
    // User not found by username, attempt to sign in with the identifier as email.
    signInWithEmailAndPassword(auth, lowercaseIdentifier, password)
      .then((userCredential) => {
        console.log("User logged in successfully");

        const payload = {
          uid: userCredential.user.uid,
          username: lowercaseIdentifier,
          email: email,
        };

        const token = jwt.sign(payload, secretKey, { expiresIn: "336h" });

        res.status(200).send({ token: token, uid: userCredential.user.uid });
      })
      .catch((error) => {
        console.error("Error:", error.message);
        console.error(lowercaseIdentifier, password);
        res.status(400).send({ error: error.message });
      });
  }
});

app.post("/validate", (req, res) => {
  const token = req.body.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, secretKey);
      console.log("Good JWT");
      res.status(200).send({ valid: true, username: decoded.username });
    } catch (e) {
      console.log("Bad JWT");
      res.status(401).send({ valid: false, error: e.message });
    }
  } else {
    console.log("Error JWT");
    res.status(400).send({ valid: false, error: "No token provided" });
  }
});

app.get("/:username", async (req, res) => {
  const { username } = req.params;
  const lowercaseUsername = username.toLowerCase();

  try {
    // Get the user documents from Firestore
    const userDocs = await getDocs(collection(db, "users"));
    let userData = null;

    userDocs.forEach((doc) => {
      if (doc.data().username === lowercaseUsername) {
        userData = doc.data();
      }
    });

    if (userData) {
      // Sort the properties of the userData object
      const sortedUserData = {};
      Object.keys(userData)
        .sort()
        .forEach((key) => {
          sortedUserData[key] = userData[key];
        });

      // If the user exists, send their data in the response
      res.status(200).json(sortedUserData);
    } else {
      // If the user doesn't exist, send a 404 error
      res.status(404).send({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error getting user data:", error);
    res.status(500).send({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(3000, () => {
  console.log("Example app listening on port 3000!");
});
