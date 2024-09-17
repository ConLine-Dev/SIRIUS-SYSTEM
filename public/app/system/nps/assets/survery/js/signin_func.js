var win = navigator.platform.indexOf('Win') > -1;
if (win && document.querySelector('#sidenav-scrollbar')) {
    var options = {
        damping: '0.5'
    }
    Scrollbar.init(document.querySelector('#sidenav-scrollbar'), options);
}

async function handleCredentialResponse(response) {
    const data = jwt_decode(response.credential)
    if (data.email_verified) {
        localStorage.setItem('npsUser', JSON.stringify(data));
        window.location.href = "/app/dashboard";

    }
}

async function initializeGoogleLogin() {
    return new Promise((resolve, reject) => {
        google.accounts.id.initialize({
            client_id: "974028688166-5h2t3rjt11upk5v78f6q2tv4kf8giqa3.apps.googleusercontent.com",
            callback: (response) => {
                handleCredentialResponse(response);
                resolve();
            }
        });
    });
}

async function renderGoogleButton() {
    return new Promise((resolve, reject) => {
        google.accounts.id.renderButton(
            document.querySelector(".googleLogin"),
            {
                // locale:"en-US"
            }
        );
        resolve();
    });
}

async function performGoogleLogin() {
    initializeGoogleLogin();
    await renderGoogleButton();   // Wait for button rendering
    google.accounts.id.prompt();
}

// Call the function to perform the Google login process
performGoogleLogin();