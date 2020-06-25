var stripe;

var stripeElements = function (publicKey) {
    stripe = Stripe(publicKey);
    var elements = stripe.elements();

    // Element styles
    var style = {
        base: {
            fontSize: '16px',
            color: '#32325d',
            fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
            fontSmoothing: 'antialiased',
            '::placeholder': {
                color: 'rgba(0,0,0,0.4)'
            }
        }
    };

    var card = elements.create('card', {
        style: style
    });

    card.mount('#card-element');

    // Element focus ring
    card.on('focus', function () {
        var el = document.getElementById('card-element');
        el.classList.add('focused');
    });

    card.on('blur', function () {
        var el = document.getElementById('card-element');
        el.classList.remove('focused');
    });

    document.querySelector('#submit').addEventListener('click', function (evt) {
        evt.preventDefault();
        changeLoadingState(true); ///^^^^^^***SHOULD BE TRUE disabled for testing pourpuses 
        // Initiate payment
        createPaymentMethodAndCustomer(stripe, card);
    });
};

function showCardError(error) {
    changeLoadingState(false);
    // The card was declined (i.e. insufficient funds, card has expired, etc)
    var errorMsg = document.querySelector('.sr-field-error');
    errorMsg.textContent = error.message;
    setTimeout(function () {
        errorMsg.textContent = '';
    }, 8000);
}

var createPaymentMethodAndCustomer = function (stripe, card) {
    var cardholderEmail = document.querySelector('#email').value;
    stripe
        .createPaymentMethod({
            type: 'card',
            card: card,
            billing_details: {
                email: cardholderEmail,
            },
        })
        .then(function (result) {
            if (result.error) {
                showCardError(result.error);
            } else {
                console.log("estoy en create payment method" + result.paymentMethod.id + cardholderEmail)
                createCustomer(result.paymentMethod.id, cardholderEmail);
            }
        });
};




async function createCustomer() {
    let billingEmail = document.querySelector('#email').value;
    return fetch('/create-customer', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: billingEmail
            })
        })
        .then(response => {
            return response.json();
        })
        .then(result => {
            // result.customer.id is used to map back to the customer object
            // result.setupIntent.client_secret is used to create the payment method
            return result;
        });
}


function handleSubscription(subscription) {
    const {
        latest_invoice
    } = subscription;
    const {
        payment_intent
    } = latest_invoice;

    if (payment_intent) {
        const {
            client_secret,
            status
        } = payment_intent;

        if (status === 'requires_action') {
            stripe.confirmCardPayment(client_secret).then(function (result) {
                if (result.error) {
                    // Display error message in your UI.
                    // The card was declined (i.e. insufficient funds, card has expired, etc)
                    changeLoadingState(false);
                    showCardError(result.error);
                } else {
                    // Show a success message to your customer
                    confirmSubscription(subscription.id);
                }
            });
        } else {
            // No additional information was needed
            // Show a success message to your customer
            orderComplete(subscription);
        }
    } else {
        orderComplete(subscription);
    }
}

function confirmSubscription(subscriptionId) {
    return fetch('/subscription', {
            method: 'post',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                subscriptionId: subscriptionId
            })
        })
        .then(function (response) {
            return response.json();
        })
        .then(function (subscription) {
            orderComplete(subscription);
        });
}

function getPublicKey() {
    return fetch('/public-key', {
            method: 'get',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(function (response) {
            return response.json();
        })
        .then(function (response) {
            stripeElements(response.publicKey);
        });
}

getPublicKey();

/* ------- Post-payment helpers ------- */

/* Shows a success / error message when the payment is complete */
var orderComplete = function (subscription) {
    changeLoadingState(false);
    var subscriptionJson = JSON.stringify(subscription, null, 2);
    document.querySelectorAll('.payment-view').forEach(function (view) {
        view.classList.add('hidden');
    });
    document.querySelectorAll('.completed-view').forEach(function (view) {
        view.classList.remove('hidden');
    });
    document.querySelector('.order-status').textContent = subscription.status;
    document.querySelector('code').textContent = subscriptionJson;
};

// Show a spinner on subscription submission
var changeLoadingState = function (isLoading) {
    if (isLoading) {
        document.querySelector('#spinner').classList.add('loading');
        document.querySelector('button').disabled = true;

        document.querySelector('#button-text').classList.add('hidden');
    } else {
        document.querySelector('button').disabled = false;
        document.querySelector('#spinner').classList.remove('loading');
        document.querySelector('#button-text').classList.remove('hidden');
    }
};




////////////////

function createPaymentMethod(cardElement, customerId, priceId) {
    return stripe
        .createPaymentMethod({
            type: 'card',
            card: cardElement,
        })
        .then((result) => {
            if (result.error) {
                displayError(error);
            } else {
                createSubscription({
                    customerId: customerId,
                    paymentMethodId: result.paymentMethod.id,
                    priceId: priceId,
                });
            }
        });
}

function createSubscription({
    customerId,
    paymentMethodId,
    priceId
}) {
    return (
        fetch('/create-subscription', {
            method: 'post',
            headers: {
                'Content-type': 'application/json',
            },
            body: JSON.stringify({
                customerId: customerId,
                paymentMethodId: paymentMethodId,
                priceId: priceId,
            }),
        })
        .then((response) => {
            return response.json();
        })
        // If the card is declined, display an error to the user.
        .then((result) => {
            if (result.error) {
                // The card had an error when trying to attach it to a customer.
                throw result;
            }
            return result;
        })
        // Normalize the result to contain the object returned by Stripe.
        // Add the addional details we need.
        .then((result) => {
            return {
                paymentMethodId: paymentMethodId,
                priceId: priceId,
                subscription: result,
            };
        })
        // Some payment methods require a customer to be on session
        // to complete the payment process. Check the status of the
        // payment intent to handle these actions.
        .then(handlePaymentThatRequiresCustomerAction)
        // If attaching this card to a Customer object succeeds,
        // but attempts to charge the customer fail, you
        // get a requires_payment_method error.
        .then(handleRequiresPaymentMethod)
        // No more actions required. Provision your service for the user.
        .then(onSubscriptionComplete)
        .catch((error) => {
            // An error has happened. Display the failure to the user here.
            // We utilize the HTML element we created.
            showCardError(error);
        })
    );
}

function onSubscriptionComplete(result) {
    // Payment was successful.
    if (result.subscription.status === 'active') {
        // Change your UI to show a success message to your customer.
        // Call your backend to grant access to your service based on
        // `result.subscription.items.data[0].price.product` the customer subscribed to.

    }
}