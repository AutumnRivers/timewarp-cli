const cli = require('inquirer');
const cliBox = require('boxen');
const cliTxt = require('figlet');
const colors = require('chalk');
const center = require('center-text');
const os = require('os');

const cliSpin = require('ora');
const cliSpinners = require('cli-spinners');

const shell = require('child_process');

function clearConsole() {
    console.clear();
    return;
}

// Init
clearConsole();

function mainMenu(connectedDevice) {
    var welcomeWarning = "";
    if(os.platform == 'win32') welcomeWarning = "Timewarp CLI should only be run on Linux and Darwin (MacOS) machines. If you continue, you will not get any support on the GitHub.";
    var welcome = "Welcome to the CLI version of Timewarp."

    var logo = cliTxt.textSync('Timewarp', { font: "banner" });
    var cliLogo = cliBox(logo, { padding: 1, margin: 2, borderStyle: 'round', float: 'center' });
    console.log(cliLogo + '\n');
    console.log(center(welcome) + '\n');
    if(welcomeWarning) console.log(center(welcomeWarning) + "\n\n");

    var menu = [];

    if(connectedDevice) menu = ["Boot Into Recovery", "Quick Backup", "Quick Restore", "Advanced Backup", "Advanced Restore", "Flash ZIP File", "Disconnect"];
    if(!connectedDevice) menu = ["Select Device", "Quit Timewarp CLI"];

    if(connectedDevice) console.log('DEVICE CONNECTED: ' + connectedDevice.id);

    cli.prompt({
        type: "list",
        name: "mainMenu",
        message: "Timewarp CLI Main Menu",
        choices: menu
    }).then(a => {
        if(connectedDevice) {
            if(a.mainMenu == "Boot Into Recovery") {
                rebootRecovery(connectedDevice);
            }
            if(a.mainMenu == "Disconnect") {
                disconnect();
            }
        } else {
            if(a.mainMenu == "Select Device") {
                connectedDevice = selectDevice();
            } else {
                console.log('So long!');
                process.exit(0);
            }
        }
    })
}

mainMenu();

function selectDevice() {
    var device;
    shell.exec('adb devices', (err, output) => {
        if(err) throw err;
        const devices = output.split('\n');
        devices.shift();
        cli.prompt({
            type: 'list',
            name: 'devices',
            message: 'Select Device',
            choices: devices
        }).then(a => {
            const id = a.devices.split('	')[0];
            device = {id: id, device: a.devices};
            clearConsole();
            mainMenu(device);
            return;
        })
    })
}

function rebootRecovery(device) {
    var spin = cliSpin({text: colors.green('Booting into recovery...') + '(This may take a while!)', spinner: cliSpinners.line}).start();
    shell.exec('adb -s ' + device.id + ' reboot recovery', (err, out) => {
        if(err) {
            spin.fail();
            console.error(colors.red('The reboot failed with the following error: \n') + err);
            setTimeout(() => {
                clearConsole();
                mainMenu(device);
            }, 3000)
        } else {
            var deviceInt = setInterval(() => {
                searchForDevice(device, deviceInt, spin);
            }, 1000);
        }
    });
}

function searchForDevice(device, interval, spinner) {

    shell.exec('adb devices', (err, output) => {
        if(err) throw err;
        const devices = output.split('\n');
        devices.shift();
        devices.forEach((d) => {
            if(d.startsWith(' ')) return;
            const id = d.split(' ')[0];
            if(id.startsWith(device.id)) {
                clearInterval(interval);
                spinner.succeed();
                console.log(colors.green('Successfully rebooted into recovery.'))
                setTimeout(() => {
                    clearConsole();
                    mainMenu(device);
                }, 3000);
            }
        })
    })

}

function disconnect() {
    clearConsole();
    mainMenu();
    return;
    // yeah, it's that easy.
}