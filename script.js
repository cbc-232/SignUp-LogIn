const signUpButton = document.getElementById('signUpButton');
const signInButton = document.getElementById('signInButton');
const signInForm = document.getElementById('signIn');
const signUpForm = document.getElementById('signup');

signUpButton.addEventListener('click', () => {
    signInForm.style.display = 'none';
    signUpForm.style.display = 'block';
});

signInButton.addEventListener('click', () => {
    signInForm.style.display = 'block';
    signUpForm.style.display = 'none';
});

document.querySelector('#signup form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fName = document.querySelector('#fName').value;
    const lName = document.querySelector('#lName').value;
    const email = document.querySelector('#signUpEmail').value;
    const password = document.querySelector('#signUpPassword').value;

    const response = await fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fName, lName, email, password })
    });

    const result = await response.json();
    if (result.message === 'success') {
        alert('Registration successful!');
        signInForm.style.display = 'block';
        signUpForm.style.display = 'none';
    } else {
        alert(`Error: ${result.error}`);
    }
});

document.querySelector('#signIn form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#signInEmail').value;
    const password = document.querySelector('#signInPassword').value;

    const response = await fetch('/signin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    if (result.message === 'success') {
        window.location.href = '/dashboard';
    } else {
        alert(`Error: ${result.error}`);
    }
});