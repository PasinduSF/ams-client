'use client'
import Table from '../../Components/Table'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams,useRouter } from 'next/navigation';
import { showErrorToast, showSuccessToast, Toast } from '@/Components/Toast';
import { useSession } from 'next-auth/react';
import { addEmployee, getEmployee, rollBackOrganizationAdmin, rollBackOrganizationEmployee } from '@/api/userApi';
import EmployeeFormDialog from './EmployeeFormDialog';
import { getServerError } from '@/utils/errors.utils';
import Loader from '@/Components/Loader';
import Web3 from 'web3';
import getContractInstance from '@/contract/contractInstance';
import * as crypto from 'crypto';
import { ethers } from 'ethers';


function getFormattedDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); 
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

const getBinaryAddress = (value) => {
  const hashSum = crypto.createHash('sha256');
  hashSum.update(value, 'utf8');
  const sha256 = hashSum.digest('hex');
  return '0x'.concat(sha256);
}



export default function Organization() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const searchParams = useSearchParams();
    const [rows,setRows] = useState([]);
    const [organizationId, setOrganizationId] = useState(null);
    const [adminWallet, setAdminWallet] = useState(null);

        // Web3 provider.
   const [web3, setWeb3] = useState(null);
   // Contract instance.
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
      const storedOrganizationId = localStorage.getItem('organizationId');
      setOrganizationId(storedOrganizationId)
      const storedAdminWallet = localStorage.getItem('adminWallet');
      setAdminWallet(storedAdminWallet);

    }, []);
    

    useEffect(() => {
      if (searchParams.get('showMessage') === 'true') {
        showSuccessToast("Login successful!");
      }
      clearQueryParams();
    }, [searchParams,router]);

    const clearQueryParams = useCallback(() => {
      router.replace(window.location.pathname);
    }, [router]);


    const toggleForm = () => {
      setOpenDialog(!openDialog);
  }

  const fetchEmployee = async ()=>{
      try{
        console.log(organizationId)
        const res = await getEmployee(organizationId);
        const employees = res.data;

        const formatedRows = employees.map((employee)=>({
          empNumber:employee.empNo,
          empName:employee.name,
          contact:employee.contactNumber,
          joinedDate:getFormattedDate(new Date(employee.createdAt))
        }))
        setRows(formatedRows);
      }catch(e){
        console.error(e);
        showErrorToast("Unable to fetch employee.");
      }
  }

  useEffect(() => {
    if (organizationId) {
      fetchEmployee();
    }
  }, [organizationId]); 

  const handleSubmitEmployee = async (values) =>{
    try{
      // Ensure that the contract is available
        if (!contract) {
          showErrorToast("Blockchain connection not available. Cannot add Employee.");
          return;
        }
      // Add Admin to database
      const res = await addEmployee(organizationId,values)
      
      const empId = res.data._id;
      const empWallet = res.data.walletAddress;
      const empName = res.data.name;  
      const wallet = await web3.eth.getAccounts();

      const bytes32AdminId = web3.utils.soliditySha3(
        { t: 'address', v: adminWallet }
      );
       // Add admin to blockchain
       try{
        setIsLoading(true);
        const tx = await contract.methods.addEmployee(empWallet,bytes32AdminId,empName);
        const estimatedGas = await tx.estimateGas({ from: wallet[0] });
        const gasWithBuffer = BigInt(estimatedGas) * BigInt(120) / BigInt(100);
        const gasHex = web3.utils.toHex(gasWithBuffer);
          const transactionResult = await tx.send({
            from: wallet[0],
            gas: gasHex
          }); 

          console.log(transactionResult)
          // Update database status after successful blockchain transaction
          showSuccessToast("Employee added successfully to both database and blockchain");
          fetchEmployee();
      }catch(e){
        console.error(e);
        // Rollback admin if blockchain transaction fails
        showErrorToast("Failed to add Employee to blockchain.");
        await rollBackOrganizationEmployee(empId);
      }  
     setOpenDialog(false);
   }catch(e){
    showErrorToast(getServerError(e));
    console.error(e)
   }finally{
     setIsLoading(false);
   }
  }
  
 
    const TableColumns = [
      { id: 'empNumber', label: 'Employee Number' },
      { id: 'empName', label: 'Employee Name' },
      { id: 'contact', label: 'Contact' },
      { id: 'joinedDate', label: 'Joined Date' },
  ];

    const disconnect = ()=>{
      router.push('/admin');
    }
    
    return (
        <div className='w-full min-h-screen bg-[#b9ccff] p-4'>
             {isLoading && <Loader />}
            <div className='w-full min-h-screen bg-white rounded-[4px]'>
                {/* Header area */}
                <div className='w-full h-[20%] p-10 flex justify-between'>
                    <h1 className='text-2xl uppercase text-black font-bold'>Admin Dashboard</h1>
                    <button
                        onClick={disconnect}
                        type="button" 
                        className="block font-semibold text-black border-2 shadow-xl border-blue-700   focus:ring-4 focus:outline-none focus:ring-blue-300  rounded-lg text-sm px-5 py-2.5 text-center "
                      >
                        Disconnect
                    </button>
                </div>
                {/* Sub Header area */}
                <div className='w-full h-[50px] p-10 flex items-center justify-between'>
                    <h1 className='text-xl capitalize text-black font-bold'>Employees</h1>
                    <button
                        onClick={toggleForm}
                        type="button" 
                        className="block text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    >
                        Add New Employee
                    </button>
                </div>
                {/* Organization details */}
                <div className='w-full p-10 flex items-center min-h-[100%] overflow-x-auto '>
                    <Table tableColumns={TableColumns} tanleRows={rows} />
                </div>
            </div>
            <EmployeeFormDialog isOpen={openDialog} onSubmit={handleSubmitEmployee}  onClose={() =>{setOpenDialog(false)}} />
            <Toast />
        </div>
    )
}