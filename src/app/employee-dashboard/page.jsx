'use client'
import { showErrorToast, showSuccessToast, Toast } from '@/Components/Toast';
import getContractInstance from '@/contract/contractInstance';
import { getCurrentTime, getCurrentTimeWithSecconds } from '@/utils/getCurrentTime';
import { getFormattedDate, getTodayDate } from '@/utils/getFormattedDate';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react'
import Web3 from 'web3';
import { getServerError } from '@/utils/errors.utils';
import { ATTENDANCE_END_TIME, ATTENDANCE_START_TIME, LATE, ON_TIME } from '../constants/attendanceMarkTime';
import Loader from '@/Components/Loader';
import { dailyAttendanceMark, getDailyAttendance } from '@/api/userApi';
import Table from '@/Components/Table';


function page() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const [rows,setRows] = useState([]);
    const [empId, setEmpId] = useState(null);
    const [currentDate, setCurrentDate] = useState('');
    const [time, setTime] = useState('');
    const [markAttendance,setMarkAttendance]=useState(false);
    const [lastMarkedDate, setLastMarkedDate] = useState('');
    const [today, setToday] = useState('');
    const [status,setStatus]= useState(null);
    const [web3, setWeb3] = useState(null);
    const [contract, setContract] = useState(null);

   // Initialize Web3 and the contract when the component mounts.
   useEffect(() => {
      async function initialize() {
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);
      }
        const contractInstance = await getContractInstance();
        setContract(contractInstance);

      }
      initialize();
    }, []);


    useEffect(() => {
      const storedEmpId = localStorage.getItem('empId');
      setEmpId(storedEmpId)
    }, []);
    

    useEffect(() => {
      if (searchParams.get('showMessage') === 'true') {
        showSuccessToast("login successful!");
      }
      clearQueryParams();
    }, [searchParams,router]);

    const clearQueryParams = useCallback(() => {
      router.replace(window.location.pathname);
    }, [router]);

    useEffect(() => {
        const date = getTodayDate();
        const time = getCurrentTime();
        setCurrentDate(date);
        setTime(time);
        setToday(date);
      }, []); 

      useEffect(() => {
        if (lastMarkedDate !== today) {
          setMarkAttendance(false); 
          setLastMarkedDate(today); 
        }
      }, [today, lastMarkedDate]);

      const isWithinTimeRange = (currentTime, startTime, endTime) => {
        return currentTime >= startTime && currentTime <= endTime;
      };

      const markTodayAttendance = async  () => {
        try{
          // Ensure that the contract is available
          if (!contract) {
            showErrorToast("Blockchain connection not available. Cannot mark attendance.");
            return;
          }
            const currentTime = getCurrentTimeWithSecconds();
            const status = isWithinTimeRange(currentTime, ATTENDANCE_START_TIME, ATTENDANCE_END_TIME) 
            ? ON_TIME 
            : LATE;
            const reqBody = {
              status 
            }
            // Mark attendance to database
            await dailyAttendanceMark(empId,reqBody)

             // Mark attendance to blockchain
            try {
              setIsLoading(true);
              const wallet = await web3.eth.getAccounts();
              const tx = await contract.methods.markAttendance(wallet[0]);
              const estimatedGas = await tx.estimateGas({ from: wallet[0] });
              const gasWithBuffer = BigInt(estimatedGas) * BigInt(120) / BigInt(100);
              const gasHex = web3.utils.toHex(gasWithBuffer);
                const transactionResult = await tx.send({
                  from: wallet[0],
                  gas: gasHex
                });
              console.log(transactionResult)
              showSuccessToast("Attendance marked successfully to both database and blockchain");
              fetchAttendance(empId);
            }catch(error){
              console.log(error)
              showErrorToast("Failed to Mark attendance to blockchain.");
            }
            setMarkAttendance(true);       
        }catch(e){
            showErrorToast(getServerError(e));
        }finally{
            setIsLoading(false);
        }
      }

      const fetchAttendance = async (storedEmpId) =>{
        try{
            setIsLoading(true);
            const res = await getDailyAttendance(storedEmpId);
            const attendances = res.data;
            const formatedRows = attendances.map((attendace)=>({
                timestamp:`${getFormattedDate(attendace.date)} ${attendace.time}`,
                status:attendace.status
            }))

            const isTodayMarked = attendances.some(attendance => 
              getFormattedDate(attendance.date) === today
            );
            const isTodayStatus = attendances.some(attendance => 
              attendance.status === ON_TIME 
            );
             if(isTodayStatus){
               setStatus(ON_TIME);
             }else{
              setStatus(LATE);
             }
             setMarkAttendance(!!isTodayMarked);
             setRows(formatedRows);
           
        }catch(e){
            showErrorToast(getServerError(e));
        }finally{
            setIsLoading(false);
        }
      }
      
      useEffect(() => {
        const storedEmpId = localStorage.getItem('empId');
        fetchAttendance(storedEmpId);
      }, [today])
      

      const TableColumns = [
        { id: 'timestamp', label: 'Timestamp' },
        { id: 'status', label: 'Status' },
      ];
    

  return (
    <div className='w-full min-h-screen bg-[#b9ccff] p-4'>
    {isLoading && <Loader />}
    <div className='w-full min-h-[100%] bg-white rounded-[4px]'>
        {/* Header area */}
        <div className='w-full h-[20%] p-10'>
            <h1 className='text-2xl uppercase text-black font-bold'>Employee Dashboard</h1>
        </div>
        {/* Sub Header area */}
        <div className='w-full h-[50px] p-10 flex items-center justify-between'>
            <h1 className='text-xl capitalize text-black font-bold'>Mark Attendance</h1>
        </div> 
        <div className='w-full h-[230px] pl-10'>
            <div className='w-[200px] h-full bg-white shadow-md rounded-xl border-2  '>
                {/* Card section */}
                <div className='w-full h-full flex  flex-col gap-6 pt-5'>
                    <div className='w-[90%] h-[20%]  flex flex-col  gap-[5px] pl-3'>
                        <p className='text-sm text-gray-400'>Date</p>
                        <p className='text-[16px] text-black'>{currentDate}</p>
                    </div>
                    <div className='w-[90%] h-[20%]  flex flex-col gap-[5px] pl-3'>
                        <p className='text-sm text-gray-400'>Current Time</p>
                        <p className='text-[16px] text-black'>{time}</p>
                    </div>
                    <div className='w-[90%] h-[60%]  flex flex-col  gap-[5px]'>
                        <p className='text-sm text-gray-400 pl-3 '>Mark</p>
                        <div className='w-full flex justify-center pl-3'>
                            {!markAttendance ? (
                                <button onClick={markTodayAttendance} className='w-[150px] text-green-600 mt-2 h-[30px] rounded-md text-[16px] flex items-center justify-center border-2 border-green-600'>
                                 Mark Attendance
                                </button>

                            ):(
                                <div
                                className={`w-[150px] mt-2 h-[30px] rounded-md text-[16px] flex items-center justify-center ${
                                  status === ON_TIME ? 'bg-green-600' : 'bg-orange-400'
                                }`}
                            >
                                {status === ON_TIME  ? 'Marked on Time' : 'Late'}
                            </div>                     
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
       {/* Organization details */}
       <div className='w-full p-10 flex items-center h-full'>
           <Table tableColumns={TableColumns} tanleRows={rows} />
       </div>
   </div>
   <Toast />
</div>
  )
}

export default page