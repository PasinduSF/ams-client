// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// Keep track of counts
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract AttendanceManagementSystem is Ownable, AccessControl {
    using Counters for Counters.Counter;

    constructor() Ownable(msg.sender) {}

    // Define Roles
    enum Role {
        Admin,
        User
    }

    Counters.Counter private _organiZationCount;
    Counters.Counter private _employeeCount;
    Counters.Counter private _adminCount;

    struct Organization {
        bytes32 id;
        bool exists;
    }

    struct Admins {
        bytes32 id;
        bytes32 organizationId;
        bool exists;
    }

    struct Employee {
        bytes32 id;
        bytes32 organizationId;
        bool exists;
    }

    struct Attendance {
        bytes32 empId;
        uint256 date;
    }

    mapping(address => Role) private roles;
    mapping(bytes32 => Organization) private Organizations;
    mapping(address => Admins) private admins;
    mapping(bytes32 => bytes32) public adminToOrganization;
    mapping(bytes32 => Employee) private employees;
    mapping(address => bytes32) public employeeToId;
    mapping(bytes32 => Attendance) public checkAttendance;
    mapping(bytes32 => mapping(uint256 => bool)) public attendance;

    event OrganizationCreated(bytes32 indexed orgId);
    event AdminAdded(bytes32 indexed orgId, bytes32 indexed adminAddress);
    event EmployeeAdded(bytes32 indexed orgId, address indexed employeeAddress);
    event AttendanceMarked(bytes32 indexed employeeId, uint256 date);

    modifier onlyAdmin() {
        require(
            roles[msg.sender] == Role.Admin,
            "Access restricted to Admins only"
        );
        _;
    }

    modifier onlyUser() {
        require(
            roles[msg.sender] == Role.User,
            "Access restricted to Users only"
        );
        _;
    }

    function createOrganization(
        bytes32 _orgId
    ) public onlyOwner returns (bytes32) {
        // Ensure that the organization doesn't already exist
        require(!Organizations[_orgId].exists, "Organization already exists");

        // Increment the organization counter
        _organiZationCount.increment();

        // Create the organization and store it in the mapping
        Organizations[_orgId] = Organization({id: _orgId, exists: true});
        emit OrganizationCreated(_orgId);
        // Return the organization ID as confirmation
        return (_orgId);
    }

    function addAdmin(
        address _adminAddress,
        bytes32 _orgId
    ) public onlyOwner returns (bytes32) {
        // Generate a unique employee ID (could use address or any unique identifier)
        bytes32 adminId = keccak256(abi.encodePacked(_adminAddress));

        // Ensure that the organization doesn't already exist
        require(Organizations[_orgId].exists, "Organization does not  exists");

        require(
            adminToOrganization[adminId] == bytes32(0),
            "Admin already assigned to an organization"
        );

        // Increment the admin counter
        _adminCount.increment();

        // Create the admin and store it in the mapping
        admins[_adminAddress] = Admins({
            id: adminId,
            organizationId: _orgId,
            exists: true
        });

        adminToOrganization[adminId] = _orgId;
        roles[_adminAddress] = Role.Admin;
        emit AdminAdded(_orgId, adminId);

        return (adminId);
    }

    function addEmployee(
        address _employeeAddress,
        bytes32 _adminId
    ) public onlyAdmin returns (bytes32) {
        bytes32 orgId = adminToOrganization[_adminId];
        require(
            adminToOrganization[_adminId] != bytes32(0),
            "Admin not associated with any organization"
        );

        // Generate a unique employee ID (could use address or any unique identifier)
        bytes32 employeeId = keccak256(
            abi.encodePacked(_employeeAddress, block.timestamp)
        );

        // Ensure the employee doesn't already exist
        require(!employees[employeeId].exists, "Employee already exists");

        // Increment employee count
        _employeeCount.increment();

        // Add employee to the mapping
        employees[employeeId] = Employee({
            id: employeeId,
            organizationId: orgId,
            exists: true
        });
        employeeToId[_employeeAddress] = employeeId;
        roles[_employeeAddress] = Role.User;
        // Emit event for the new employee
        emit EmployeeAdded(orgId, _employeeAddress);

        // Return the new employee ID
        return (employeeId);
    }

    function markAttendance(
        address _empAddress
    ) external onlyUser returns (uint256) {
        bytes32 employeeId = employeeToId[_empAddress];
        require(employeeId != bytes32(0), "Employee not registered");
        uint256 today = block.timestamp / 1 days;
        require(
            !attendance[employeeId][today],
            "Attendance already marked for today"
        );
        attendance[employeeId][today] = true;
        emit AttendanceMarked(employeeId, today);

        checkAttendance[employeeId] = Attendance({
            empId: employeeId,
            date: today
        });
        return today;
    }

    function getAttendance(
        address _empAddress
    ) public view onlyUser returns (Attendance memory) {
        bytes32 employeeId = employeeToId[_empAddress];
        require(employeeId != bytes32(0), "Employee not registered");
        Attendance memory empAttendance = checkAttendance[employeeId];
        return empAttendance;
    }

    function verifyAttendance(
        uint256 date
    ) external view onlyUser returns (bool) {
        bytes32 employeeId = employeeToId[msg.sender];
        require(employeeId != bytes32(0), "Employee not registered");
        return attendance[employeeId][date];
    }
}
