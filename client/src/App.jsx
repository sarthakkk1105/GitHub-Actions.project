import React from 'react'
import { useEffect } from 'react';
import axios from 'axios';
import { Routes ,Route} from 'react-router-dom'
import Home from './pages/home.jsx'
import Auth from './pages/Auth.jsx'
import { useDispatch } from 'react-redux';
import { setUserData } from './redux/userSlice.js';
import InterviewPage from './pages/InterviewPage.jsx';
import Interviewhistory from './pages/Interviewhistory.jsx';
import Pricing from './pages/Pricing.jsx';
import InterviewReport from './pages/InterviewReport.jsx';


export const ServerUrl = "http://localhost:8000"

const App = () => {

  const dispatch = useDispatch();

  useEffect(() => {
    const getuser = async () => {
      
      try {
        const result = await axios.get(`${ServerUrl}/api/user/getUser`, { withCredentials: true });
        dispatch(setUserData(result.data));
      } catch (error) {
        console.error("Error fetching user:", error);
        dispatch(setUserData(null));
      }
    };
    getuser();
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/interview" element={<InterviewPage />} />
      <Route path="/history" element={<Interviewhistory />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/report/:id" element={<InterviewReport />} />
      

    </Routes>
  )
}

export default App