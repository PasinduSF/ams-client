'use client'
import {  showErrorToast, Toast } from '../../Components/Toast';
import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import Web3 from 'web3';
import axios from 'axios';
import { getServerError } from '@/utils/errors.utils';
import {  authenticateEmp, getNonce } from '@/api/apiAuth';
import Loader from '@/Components/Loader';

function Page() {
    const router = useRouter();
    const [web3, setWeb3] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (window.ethereum) {
            const web3Instance = new Web3(window.ethereum);
            setWeb3(web3Instance);
        }
    }, []);

    const requestAccount = async () => {
        if (!web3) {
            showErrorToast("Web3 not initialized. Please make sure MetaMask is installed.");
            return;
        }

        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const accounts = await web3.eth.getAccounts();
            await authenticate(accounts[0]);
        } catch (error) {
            console.error('Error requesting account:', error);
            showErrorToast("Error connecting to MetaMask. Please try again.");
        }
    }

    const authenticate = async (account) => {
        try {
          setIsLoading(true);
          const res = await getNonce(account);
          const { message, tempToken } = res.data;
          const signature = await web3.eth.personal.sign(message, account, '');
          const reqBody = {
            signature: signature
          };
          const respoanse = await authenticateEmp(reqBody, tempToken); 
          console.log("respoanse",respoanse);
          if (respoanse.data && respoanse.data.empId ) {
            localStorage.setItem('empId', respoanse.data.empId);
          } 
          router.push("/employee-dashboard?showMessage=true");
        } catch (error) {
          showErrorToast(getServerError(error));
        }finally{
          setIsLoading(false);
        }
      };

    return (
        <div className='w-full h-screen bg-white items-center justify-center flex'>
            {isLoading && <Loader />}
            <div className='w-[532px] h-[549px] rounded-[12px] bg-[#0744ED0D] relative'>
                <div className='w-full h-[40%] flex items-center justify-center flex-col gap-4 p-4'>
                    <h1 className='text-3xl leading-3 font-bold text-black'>LOGIN</h1>
                    <p className="mb-6 text-sm font-normal text-black text-center">
                        Connect your wallet to authenticate and access the platform.
                    </p>
                </div>
                <div className='w-full h-[20%] absolute bottom-0 p-3 flex items-center justify-center'>
                    <button onClick={requestAccount}
                        type="button" className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none">
                        Connect Wallet
                    </button>
                </div>
            </div>
            <Toast />
        </div>
    )
}

export default Page