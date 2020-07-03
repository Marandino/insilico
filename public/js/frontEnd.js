//TICKER DOM ANIMATION

document.querySelectorAll('.accordionButton').forEach((button) => {
    button.addEventListener('click', () => {
        const accordionContent = button.nextElementSibling;
        button.classList.toggle('active');
        if (button.classList.contains('active')) {
            accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px'; //scrollHeight gives back the auto height
            accordionContent.style.padding = "1em";
        } else {
            accordionContent.style.maxHeight = 0;
            accordionContent.style.padding = "0 1em";
        }
    });
});



////GET EXCHANGE RATE 
// //// pop-up 

// const popup = document.getElementById("popup"),
//     basic = document.getElementById("basicButton"),
//     premium = document.getElementById("premiumButton"),
//     vip = document.getElementById("vipButton"),
//     hideButton = document.getElementById("hidePopUp"),
//     amount = document.getElementById("bitcoinAmount"),
//     usd = document.getElementById("usdAmount"),
//     title = document.getElementById("packageTitle")
// var bitcoinRate = 0;

// basic.addEventListener("click", showPopUp);
// premium.addEventListener("click", showPopUp);
// vip.addEventListener("click", showPopUp);
// /////

// hideButton.addEventListener("click", hidePopUp);


// function showPopUp(event) {
//     changePrice(event.toElement.id);
//     console.log(event.toElement.id);
//     popup.classList.remove("hidden");
// }

// function hidePopUp() {
//     popup.classList.add("hidden");
// }


// async function exchangeRate() {
//     var bitcoinfetch = await fetch('https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=BTC&api_key=782824d04d7b391c833edfbab9264c4548cf44248ff2b3fbf382250bccea56f7')
//         .then(response => response.json())
//     const bitcoinRate = bitcoinfetch.BTC;
//     return (bitcoinRate);
// }

// async function changePrice(package) {
//     var bitcoinRate = await exchangeRate();
//     console.log("current bitcoin exchange rate is " + bitcoinRate);
//     if (package === "premiumButton") {
//         var premiumPrice = bitcoinRate * 200;
//         amount.textContent = premiumPrice;
//         usd.textContent = 200;
//         title.textContent = "Premium"
//     } else if (package === "basicButton") {
//         var basicPrice = bitcoinRate * 100;
//         usd.textContent = "100";
//         title.textContent = "Basic"
//         amount.textContent = basicPrice;
//     } else if (package === "vipButton") {
//         var vipPrice = bitcoinRate * 2000;
//         amount.textContent = vipPrice;
//         usd.textContent = 2000;
//         title.textContent = "VIP"
//     }
// }

// //// END OF POPUP´

////STRIPE PAYMENTS
// Create a Stripe client.
const stripe = Stripe('pk_test_51Gsx6JJyRCyDOw0DXnApg528fwHVjqfXGDLDGjAsUJGH4ELEZWc9hOW85e4PSOPQt0iDqfH8w1UVTwmmMlnFMV0s00by1xmXp4');

// Create an instance of Elements.
const elements = stripe.elements();

// INITIALIZE
// Custom styling can be passed to options when creating an Element.
// (Note that this demo uses a wider set of styles than the guide below.)
var style = {
    base: {
        color: '#32325d',
        fontSize: '16px',
        '::placeholder': {
            color: '#aab7c4'
        }
    },
    invalid: {
        color: '#e74b7f',
        iconColor: '#e74b7f'
    }
};

// Create an instance of the card Element.
var card = elements.create('card', {
    style: style
});

// Add an instance of the card Element into the `card-element` <div>.
card.mount('#card-element');

// Handle real-time validation errors from the card Element.
card.on('change', function (event) {
    var displayError = document.getElementById('card-errors');
    if (event.error) {
        displayError.textContent = event.error.message;
    } else {
        displayError.textContent = '';
    }
});

// Handle form submission.
var form = document.getElementById('payment-form');
form.addEventListener('submit', function (event) {
    event.preventDefault();

    stripe.createToken(card).then(function (result) {
        if (result.error) {
            // Inform the user if there was an error.
            var errorElement = document.getElementById('card-errors');
            errorElement.textContent = result.error.message;
        } else {
            // Send the token to your server.
            stripeTokenHandler(result.token);
        }
    });
});

// Submit the form with the token ID.
function stripeTokenHandler(token) {
    // Insert the token ID into the form so it gets submitted to the server
    var form = document.getElementById('payment-form');
    var hiddenInput = document.createElement('input');
    hiddenInput.setAttribute('type', 'hidden');
    hiddenInput.setAttribute('name', 'stripeToken');
    hiddenInput.setAttribute('value', token.id);
    form.appendChild(hiddenInput);
    // Submit the form
    form.submit();
}

// ELEMENTS
// EVENTS


////===== END OF STRIPE