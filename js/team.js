import {
    input,
    output,
    screen,
    newline
} from './main.js'

let inputState = false;
let currentStage = "";

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
                    break;


                case "getRate":
                    // Success
                    const proposedRate = input.value;
                    if (proposedRate > 0) {
                        newEmployeeInfo.rate = proposedRate;
                        outputLine.innerHTML = `${outputLine.innerHTML} - ${proposedRate}`;
                        currentStage = "getHours";
                        console.info("Hours:");
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
                    break;

                    
                case "addEmployee":
                    console.info("Name:");
                    currentStage = "getName";
            }

            // Reset input
            input.value = "";
            
            // Continue looping if we're not done
            if (currentStage !== "getManager") {
                Methods.addEmployee();
            }
            
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

    static removeEmployee() {

    }

    static editEmployee() {

    }

    static displayEmployee() {

    }
}

// Data
const employees = [];

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