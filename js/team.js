import {
    input,
    output,
    screen,
    newline
} from './main.js'

let inputState = false;
let currentStage = "";
let currentData = "";
let pendingOperation = "";

// Data
const employees = [];

const newEmployeeInfo = {
    name : "",
    rate : 0,
    hours : 0,
    isManager : false,
}

class Employee {
    constructor(_name, _rate, _hours) {
        this.name = _name;
        this.rate = _rate; 
        this.hours = _hours;
        this.salary = this.rate * this.hours * 52;
    }
}

class Manager extends Employee {
    constructor(_name, _rate, _hours) {
        super(_name, _rate, _hours);
        this.role = "Manager";
    }
}

class PartTime extends Employee {
    constructor(_name, _rate, _hours) {
        super(_name, _rate, _hours);
        this.role = "Part Time";
    }
}

class Methods {
    static isBlocking() {
        return inputState;
    }

    static handleSubKeydown(e) {
        if(e.key==='Enter'){
            e.preventDefault();

            // Abort if not in inputState
            if(!inputState) return;

            if(input.value.toLowerCase() === "cancel") {
                // Reset
                input.value = "";
                console.error("Canceled");
                inputState = false;
                currentStage = "";
                return;
            };

            const outputLine = document.querySelector("#output > div:last-of-type > span");

            switch (currentStage) {
                case "getName":
                    // Validation
                    const proposedName = input.value;

                    // Check for blank submission
                    if (!proposedName) {
                        console.error('Name cannot be blank.');
                        console.info('Name?');
                        break;
                    }
                    // Check for existing names
                    if (employees.findIndex(emp => emp.name.toLowerCase() === proposedName.toLowerCase()) >= 0) {
                        console.error(`An employee named "${proposedName}" already exists.`);
                        console.info('Enter a different name:');
                        break;
                    }

                    // Success
                    newEmployeeInfo.name = input.value;
                    outputLine.innerHTML = `${outputLine.innerHTML} - ${input.value}`;
                    currentStage = "getRate";
                    console.info("Rate:");
                    Methods.addEmployee();
                    break;


                case "getRate":
                    // Success
                    const proposedRate = input.value;
                    if (proposedRate > 0) {
                        newEmployeeInfo.rate = proposedRate;
                        outputLine.innerHTML = `${outputLine.innerHTML} - ${proposedRate}`;
                        currentStage = "getHours";
                        console.info("Hours:");
                        Methods.addEmployee();
                        break;
                    } else {
                        // Validation
                        console.error("Must be a positive number.");
                        console.info("Rate:");
                        break;
                    }       
                    
                    
                case "getHours":
                    const proposedHours = input.value;
                    // Validation 1
                    if (proposedHours > 168) {
                        console.error("Only 168 hours in a week.");
                        console.info("Hours:");
                        break;
                    } // Success
                    else if (proposedHours > 0) {
                        newEmployeeInfo.hours = proposedHours;
                        outputLine.innerHTML = `${outputLine.innerHTML} - ${proposedHours}`;
                        currentStage = "getManager";
                        console.info("Manager? Y/N");
                        Methods.addEmployee();
                        break;
                    } else {
                        // Validation 2
                        console.error("Must be a positive number.");
                        console.info("Hours:");
                        break;
                    }


                case "getManager":
                    input.value = input.value.toUpperCase();
                    if(input.value === "Y") newEmployeeInfo.isManager = true;
                    else if(input.value === "N") newEmployeeInfo.isManager = false;
                    else {
                        console.error("Invalid input.")
                        console.info("Manager? Y/N");
                        break;
                    }
                    outputLine.innerHTML = `${outputLine.innerHTML} - ${input.value}`;
                    currentStage = "addEmployeeComplete";
                    Methods.addEmployee();
                    break;


                case "addEmployee":
                    console.info("Name:");
                    currentStage = "getName";
                    Methods.addEmployee();
                    break;


                // Handler for Methods.selectEmployee()
                case "getEmployee":
                    console.info("Select a user by full name or ID:");
                    currentStage = "getEmployee1";
                    break;

                case "getEmployee1":
                    
                    const userArgs = input.value;

                    // If blank, error. Else pass for later validation
                    if (!userArgs) {
                        console.error("Invalid input.")
                        console.info("Select a user by full name or ID:");
                        break;
                    } else {
                        currentData = userArgs;
                        currentStage = "getEmployeeComplete";
                        Methods.selectEmployee(userArgs, pendingOperation);
                        break;
                    }

                    
            }

            // Reset input
            input.value = "";
            
            return;
        }
    }

    static addEmployee() {
        // Setup
        inputState = true;
        if (currentStage === "") {
            console.log("Adding new employee. Type 'cancel' at any time to abort.");
            currentStage = "addEmployee";
        }
            
        // Output transient data to finished object
        if (currentStage === "addEmployeeComplete") {
            // Reset
            inputState = false;
            currentStage = "";

            if(newEmployeeInfo.isManager) {
                employees.push(new Manager(newEmployeeInfo.name, newEmployeeInfo.rate, newEmployeeInfo.hours));
            } else if ((newEmployeeInfo.rate * newEmployeeInfo.hours) <= 35) {
                employees.push(new PartTime(newEmployeeInfo.name, newEmployeeInfo.rate, newEmployeeInfo.hours));
            } else {
                employees.push(new Employee(newEmployeeInfo.name, newEmployeeInfo.rate, newEmployeeInfo.hours));
            }

            console.log(`Successfully added ${employees[employees.length - 1].name}`);
        }
    }


    static selectEmployee(argv, operation) {
        let validated = false;
        pendingOperation = operation;

        if (employees.length == 0) {
            console.log("No employees found");
            return;
        }

        if (currentStage === "") {
            // Set up input state
            inputState = true;
            currentStage = "getEmployee";
        }

        // Get user from currentData
        if (currentStage == "getEmployeeComplete") {
            // If number:
            if ((parseInt(currentData) - 1) >= 0 && (parseInt(currentData) - 1) < employees.length) {
                // Reset
                inputState = false;
                currentStage = "";
                currentData = parseInt(currentData) - 1;
                validated = true;
            } else {
                // Otherwise, attempt to find name match. Should always work, protected above by handler switch case getEmployee1
                // Reset
                inputState = false;
                currentStage = "";
                currentData = employees.findIndex(emp => emp.name.toLowerCase() === currentData.toLowerCase());
                validated = true;
            }
        }
        
        
        // Run on first call only and only if no args were supplied, otherwise attempt to run args
        if ((!argv) && (currentStage == "getEmployee")) {
            // Display all employees
            for(let i = 0; i < employees.length; i++) {
                if (i < 9) console.log(`0${i + 1}: ${employees[i].name}`);
                else if (i >= 9) console.log(`${i + 1}: ${employees[i].name}`);
                else {
                    console.error("An unspecified error occurred.");
                }
            }
        } else if (typeof argv == 'string' && currentStage == "getEmployee") {
            currentData = argv;

            // If number:
            if ((parseInt(currentData) - 1) >= 0 && (parseInt(currentData) - 1) < employees.length) {
                // Reset
                inputState = false;
                currentStage = "";
                currentData = parseInt(currentData) - 1;
                validated = true;
            } else {
                // Otherwise, attempt to find name match. Should always work, protected above by handler switch case getEmployee1
                // Reset
                inputState = false;
                currentStage = "";
                currentData = employees.findIndex(emp => emp.name.toLowerCase() === currentData.toLowerCase());
                validated = true;
            } 
        }

        // Selection successful. Validate. If fail, reset and abort
        if (currentData < 0 || currentData > employees.length) {
            console.error("No matching employee found.")
            currentStage = "";
            pendingOperation = "";
        }
        
        // Validated. Run operation
        if (validated) {
            switch (pendingOperation) {
                case "remove":
                    const confirmationName = employees[currentData].name;
                    employees.splice(currentData, 1);
                    console.log(`Successfully removed ${confirmationName}`)
                    break;
                case "edit":
                    break;
                case "display":
                    console.log(currentData);
                    let employeeRole = "";
                    if(!employees[currentData].role) {
                        employeeRole = "Full Time";
                    } else {
                        employeeRole = employees[currentData].role;
                    }
                    console.log(`Employee details: ${employees[currentData].name}`)
                    console.log(`----------------------------`);
                    console.log(`         Pay rate: ${employees[currentData]} / hour`);
                    console.log(`     Hours / week: ${employees[currentData]}`);
                    console.log(`Avg yearly income: ${employees[currentData]}`);
                    console.log(`             Role: ${employeeRole}`);
                    break;
            }

            // Big reset after successful operation
            currentStage = "";
            currentData = "";
            pendingOperation = "";
            inputState = false;
            input.value = "";
        }

        


    // 1: SELECT
    // If command has args
        // If args are text
            // Attempt to find employee with matching name
        // If args are number
            // Attempt to find employee (index = ID - 1)
    // If no args:
        // Show all employees
        // Request ID from user

    // 2A: REMOVE
        // Confirm user wants to remove employee NAME
        // Break or continue
        // Splice out employee (index = ID - 1)


    // 2B: EDIT
        // Confirm user wants to edit employee Name
        // Break or continue
        // Save employee index
        // Splice out employee
        // Run addEmployee()
        // Pop last employee to transient variable
        // Splice in to saved index

    // 2C: DISPLAY
        // Console.log user details
    }
}

(() => {
    // Boot
    employees.push(new Manager("John A", 22, 40));
    employees.push(new Employee("Mark D", 16, 40));
    employees.push(new PartTime("Alissa E", 18, 20));
    input.addEventListener('keydown', Methods.handleSubKeydown);
})();

export {
    Methods,
    employees
}