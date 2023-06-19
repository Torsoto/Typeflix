import React, { useEffect, useState } from "react";
import "./styles/App.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile.jsx";
import Training from "./pages/Training";
import { Route, Routes, Navigate } from "react-router-dom";
import AuthContext from "../src/components/context/AuthContext.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";

function App() {
    const [userId, setUserId] = useState("");
    const [userData, setUserData] = useState(null);
    const [text, setText] = useState(`TEST TEST TEST TEST TEST TEST TEST TEST TEST`);
    const [isLoggedIn, setIsLoggedIn] = useState({});
    const [gradientColor, setGradientColor] = React.useState('#313131');
    const [Img, setImg] = useState("https://i.imgur.com/oQUOXS8.png");
    const [time, setTime] = useState(60);
    const [avatarUrl, setAvatarUrl] = useState("");
    const [title, setTitle] = useState(null);
    const [selectedLevelIndex, setSelectedLevelIndex] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("jwt");
        if (token) {
            fetch("http://localhost:3000/validate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.valid) {
                        login(data.token);
                        setUserId(data.username);
                    } else {
                        logout();
                    }
                })
                .catch((error) => {
                    console.error("Error:", error);
                    logout();
                });
        } else {
            logout();
        }
    }, []);

    useEffect(() => {
        if (userId.length > 0) {
            let data = localStorage.getItem('userData');
            data = JSON.parse(data);
            if (data) {
                setUserData(data);
                setAvatarUrl(data.avatar);
            }
            updateUserData();
        }
    }, [userId]);

    const updateBestWpm = async (username, wpm) => {
        try {
            const response = await fetch('http://localhost:3000/updateLeaderboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, wpm }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log(data.message);
            } else {
                throw new Error('Failed to update leaderboard');
            }
        } catch (error) {
            console.error('Error updating leaderboard:', error);
            // Handle the error if needed
        }
    };

    const login = (newUser) => {
        setUserId(newUser);
        setIsLoggedIn(true);
    };

    const logout = () => {
        setUserId("");
        setUserData(null);
        setIsLoggedIn(false);
        localStorage.removeItem("jwt");
    };

    const updateUserData = () => {
        fetchData(userId).then((data) => {
            setUserData(data);
            setAvatarUrl(data.avatar);
            localStorage.setItem('userData', JSON.stringify(data));
        });
    }

    const fetchData = async (userId) => {
        try {
            const response = await fetch(`http://localhost:3000/user/${userId}`);
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return await response.json();
        } catch (error) {
            console.error("There has been a problem with your fetch operation: ", error.message);
        }
    };

    return (
        <>
            <AuthContext.Provider
                value={{
                    logout,
                    login,
                    isLoggedIn,
                    text,
                    setText,
                    gradientColor,
                    setGradientColor,
                    setImg,
                    Img,
                    time,
                    setTime,
                    userId,
                    userData,
                    avatarUrl,
                    setAvatarUrl,
                    title,
                    setTitle,
                    selectedLevelIndex,
                    setSelectedLevelIndex,
                    updateBestWpm,
                    fetchData,
                    updateUserData,
                }}
            >
                <Routes>
                    <Route path="/login"
                        element={isLoggedIn ? <Navigate to="/" /> : <Login />}
                    />
                    <Route path="/signup"
                        element={isLoggedIn ? null : <Signup />}
                    />
                    <Route path="/"
                        element={isLoggedIn ? <Home /> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/settings"
                        element={isLoggedIn ? <Settings /> : <Navigate to="/login" />}
                    />
                    <Route path="/training"
                        element={isLoggedIn ? <Training /> : <Navigate to="/login" />}
                    />
                    <Route path="/leaderboard"
                        element={isLoggedIn ? <Leaderboard /> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/:username"
                        element={isLoggedIn ? <Profile /> : <Navigate to="/login" />}
                    />
                </Routes>
            </AuthContext.Provider>
        </>
    );
}

export default App;
