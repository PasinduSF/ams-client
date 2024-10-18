'use client'
import Table from '../../Components/Table'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { faEllipsis } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FormDialog from './OrganizationFormDialog';
import AdminFormDialog from './AdminFormDialog';
import { useSearchParams,useRouter } from 'next/navigation';
import { showErrorToast, showSuccessToast, Toast } from '@/Components/Toast';
import { getRpcError, getServerError } from '@/utils/errors.utils';
import { addOrganization, addOrganizationAdmin, getAllOrganizations, rollBackOrganization, rollBackOrganizationAdmin, updateOrgBlockchainStatus } from '@/api/userApi';
import { useSession } from 'next-auth/react';
import getContractInstance from '@/contract/contractInstance';
import Web3 from 'web3';
import * as crypto from 'crypto';
import Loader from '@/Components/Loader';


const getBinaryAddress = (value) => {
  const hashSum = crypto.createHash('sha256');
  hashSum.update(value, 'utf8');
  const sha256 = hashSum.digest('hex');
  return '0x'.concat(sha256);
}

const DropdownMenu = ({ isOpen, onClose, onAddAdmin, onViewOrganization }) => {
    if (!isOpen) return null;
  
    return (
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
        <div className="py-1">
          <button onClick={onAddAdmin} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Add Admin</button>
        </div>
      </div>
    );
  };
  

export default function Organization() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [openDialogTwo, setOpenDialogTwo] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const dropdownRef = useRef(null);
    const searchParams = useSearchParams();
    const [rows,setRows] = useState([]);
    const [orgId,setOrgID] = useState(null);
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
      if (searchParams.get('showMessage') === 'true') {
        showSuccessToast("Login successful!");
      }
      clearQueryParams();
    }, [searchParams,router]);

    const clearQueryParams = useCallback(() => {
      router.replace(window.location.pathname);
    }, [router]);


    const handleAddAdmin = (id) => {
        setOpenDialogTwo(true);
        setOpenDropdown(null)
        setOrgID(id);
        console.log("id",id)
    };

    const toggleForm = () => {
      setOpenDialog(!openDialog);
  }
  
 
    const TableColumns = [
      { id: 'orgName', label: 'Organization Name' },
      { id: 'address', label: 'Address' },
      { id: 'contact', label: 'Contact' },
      { id: 'regNmber', label: 'Registration No' },
      {
        id: 'action',
        label: 'Action',
        render: (row) => (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setOpenDropdown(openDropdown === row.regNmber ? null : row.regNmber)} 
              className="text-black hover:underline"
            >
              <FontAwesomeIcon icon={faEllipsis} />
            </button>
            <DropdownMenu 
              isOpen={openDropdown === row.regNmber}
              onClose={() => setOpenDropdown(null)}
              onAddAdmin={() => handleAddAdmin(row.id)}
              onViewOrganization={() => handleViewOrganization(row)}
            />
          </div>
        ),
      }
  ];
  
    const fetchAllOrganiation = async () => {
      try{
        setIsLoading(true);
        const res = await getAllOrganizations();
        console.log(res.data);
        const organizations = res.data
        const formatedRows = organizations.map((organization,id)=> ({
            id:organization._id,
            orgName:organization.title,
            address:organization.address,
            contact:organization.contactNumber,
            regNmber:organization.regNumber

        }))
        setRows(formatedRows);
        console.log(formatedRows)
      }catch(e){
        showErrorToast("Unable to fetch organization.");
        console.error(e)
      }finally{
        setIsLoading(false);
      }
    }

    useEffect(() => {
      fetchAllOrganiation();
    }, [])

   
    // Add organization
    const handleSubmit = async (values) => {    
      try {
        if (!contract) {
          showErrorToast("Blockchain connection not available. Cannot add Organization.");
          return;
        }
        let orgId;
        // Add organization data to the centralized DB 
        const res = await addOrganization(values);
        
        const orgName = res.data.title;
        orgId = res.data._id;  // Store organization ID from the response
        const wallet = await web3.eth.getAccounts();
        
        // Convert ObjectId to string and then to bytes32
        const bytes32OrgId = getBinaryAddress(orgId);
        // Add organization to blockchain
          try {
            setIsLoading(true);
            const tx = await contract.methods.createOrganization(bytes32OrgId);
            const estimatedGas = await tx.estimateGas({ from: wallet[0] });
            const gasWithBuffer = BigInt(estimatedGas) * BigInt(120) / BigInt(100); 
            const gasHex = web3.utils.toHex(gasWithBuffer);
            
            const transactionResult = await tx.send({
              from: wallet[0],
              gas: gasHex,
            });

            console.log(transactionResult);
            
            // Update database status after successful blockchain transaction    
            showSuccessToast("Organization added successfully to both database and blockchain");
            fetchAllOrganiation();
          } catch (blockchainError) {
            // Rollback organization if blockchain transaction fails
            await rollBackOrganization(orgId);  
            showErrorToast("Failed to add organization to blockchain.");      
            showErrorToast(getRpcError(blockchainError));
            console.error(blockchainError);
          }
      } catch (dbError) {
        showErrorToast(getServerError(dbError));
      } finally {
        setOpenDialog(false);
        setOpenDropdown(null);
        setIsLoading(false);
      }
    };


    // Add organization admin
    const handleSubmitAdmin = async (values) =>{
      
      try{
        // Ensure that the contract is available
        if (!contract) {
          showErrorToast("Blockchain connection not available. Cannot add Admin.");
          return;
        }
        // Add Admin to database
        const res = await addOrganizationAdmin(orgId,values)
        const adminId = res.data._id;
        const adminWallet = res.data.walletAddress; 
        const wallet = await web3.eth.getAccounts();
        const bytes32OrgId = getBinaryAddress(orgId);

        // Add admin to blockchain
          try{
            setIsLoading(true);
            const tx = await contract.methods.addAdmin(adminWallet,bytes32OrgId);
            const estimatedGas = await tx.estimateGas({ from: wallet[0] });
            const gasWithBuffer = BigInt(estimatedGas) * BigInt(120) / BigInt(100);
            const gasHex = web3.utils.toHex(gasWithBuffer);
              const transactionResult = await tx.send({
                from: wallet[0],
                gas: gasHex
              }); 

              console.log(transactionResult)
              // Update database status after successful blockchain transaction
              showSuccessToast("Admin added successfully to both database and blockchain");
          }catch(blockchainError){
            console.error(blockchainError);
            // Rollback admin if blockchain transaction fails
            await rollBackOrganizationAdmin(adminId);
            showErrorToast("Failed to add organization admin to blockchain.");
            // showErrorToast(getRpcError(blockchainError));
          }  
         setOpenDialogTwo(false);
     }catch(dbError){
      showErrorToast(getServerError(dbError));
      console.error(dbError)
     }finally{
      setIsLoading(false);
     }
    }


    const disconnect = ()=>{
       router.push('/product-owner');
    }
      
    

    const handleViewOrganization = (row) => {
        console.log('View Organization:', row);
    };
    

  
    return (
        <div className='w-full min-h-screen bg-[#b9ccff] p-4'>
          {isLoading && <Loader />}
            <div className='w-full min-h-screen bg-white rounded-[4px]'>
                {/* Header area */}
                <div className='w-full h-[20%] p-10 flex justify-between'>
                    <h1 className='text-2xl uppercase text-black font-bold'>Organization Management Dashboard</h1>
                    <button
                        onClick={disconnect}
                        type="button" 
                        className="block text-black border-2 shadow-xl border-blue-700   focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center "
                    >
                              Disconnect
                    </button>
                </div>
                {/* Sub Header area */}
                <div className='w-full h-[50px] p-10 flex items-center justify-between'>
                    <h1 className='text-xl capitalize text-black font-bold'>Organizations</h1>
                    <button
                        onClick={toggleForm}
                        type="button" 
                        className="block text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    >
                        Add New Organization
                    </button>
                </div>
                {/* Organization details */}
                <div className='w-full p-10 flex items-center min-h-[100%] overflow-x-auto '>
                    <Table tableColumns={TableColumns} tanleRows={rows} />
                </div>
            </div>
            <FormDialog isOpen={openDialog} onClose={toggleForm}  onSubmit={handleSubmit} />
            <AdminFormDialog isOpen={openDialogTwo} onSubmit={handleSubmitAdmin} onClose={() =>{setOpenDialogTwo(false)}} />
            <Toast />
        </div>
    )
}