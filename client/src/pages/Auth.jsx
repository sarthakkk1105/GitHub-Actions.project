import React from 'react'
import { BsRobot } from "react-icons/bs";
import { IoSparkles } from "react-icons/io5";
import { motion } from "motion/react"
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from '../utils/firebase';
import axios from 'axios';
import { ServerUrl } from '../App.jsx';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice.js';
import { useNavigate } from 'react-router-dom';

const Auth = ({isModel=false}) => {

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleGoogleSignIn = async() => {
        try {
            const response = await signInWithPopup(auth, provider);
            let user = response.user;
            let name = user.displayName;
            let email = user.email;
            const res = await axios.post(`${ServerUrl}/api/auth/google`, { name, email }, { withCredentials: true });
           dispatch(setUserData(res.data));
           navigate("/");
        } catch (error) {  
            console.error("Error signing in with Google", error);
            dispatch(setUserData(null));
        }
    }
  return (
    <div className='w-full min-h-screen bg-[#f3f3f3] flex items-center justify-center px-6 py-20'>
        <motion.div
        initial={{ opacity: 0,scale: 0.5,y: -40 }}
        animate={{ opacity: 1, scale: 1,y: 0 }}
        transition={{ duration: 0.5 }}
        className='w-full max-w-md p-8 rounded-3xl bg-white shadow-2xl border border-gray-200 '>
            <div className=' flex items-center justify-center gap-3 mb-6'>
                <div className= 'bg-black text-white p-2 rounded-lg'>
                    <BsRobot size={18} />
                </div>
                <h2 className='font-semibold text-lg'>InterviewIQ.AI</h2>
            </div>
            <h1 className='text-2xl md:text-3xl font-semibold text-center leading-snug mb-4'>
               Continue with {" "}
               <span className='bg-green-100 text-green-600 px-3 py-1 rounded-full inline-flex items-center gap-2'> 
                <IoSparkles size={16}/> Ai Smart Interview</span>
            </h1>
            <p className='text-center text-gray-500 text-sm leading-relaxed md-g md:text-base'>
                Sign in to start AI-powered interview preparation and unlock your potential with personalized feedback and guidance.
            </p>
            <motion.button
                initial={{ opacity: 0,y: -40 }}
                animate={{ opacity: 1,y: 0 }}
                transition={{ duration: 0.5 }}
                whileHover={{opacity:0.9,scale:1.02}}
                whileTap={{opacity:1,scale:0.8}}
                onClick={handleGoogleSignIn}
                className='w-full flex items-center justify-center gap-3 bg-black text-white py-3 px-6 rounded-lg mt-6   shadow-md '>
                <FcGoogle size={20} />
                
                
                Continue with Google
            </motion.button>

        </motion.div>
    </div>
  )
}

export default Auth