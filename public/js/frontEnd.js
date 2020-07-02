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
//// pop-up 

const popup = document.getElementById("popup"),
    basic = document.getElementById("basicButton"),
    premium = document.getElementById("premiumButton"),
    vip = document.getElementById("vipButton"),
    hideButton = document.getElementById("hidePopUp"),
    amount = document.getElementById("bitcoinAmount"),
    usd = document.getElementById("usdAmount"),
    title = document.getElementById("packageTitle")
var bitcoinRate = 0;

basic.addEventListener("click", showPopUp);
premium.addEventListener("click", showPopUp);
vip.addEventListener("click", showPopUp);
/////

hideButton.addEventListener("click", hidePopUp);


function showPopUp(event) {
    changePrice(event.toElement.id);
    console.log(event.toElement.id);
    popup.classList.remove("hidden");
}

function hidePopUp() {
    popup.classList.add("hidden");
}


async function exchangeRate() {
    var bitcoinfetch = await fetch('https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=BTC&api_key=782824d04d7b391c833edfbab9264c4548cf44248ff2b3fbf382250bccea56f7')
        .then(response => response.json())
    const bitcoinRate = bitcoinfetch.BTC;
    return (bitcoinRate);
}

async function changePrice(package) {
    var bitcoinRate = await exchangeRate();
    console.log("current bitcoin exchange rate is " + bitcoinRate);
    if (package === "premiumButton") {
        var premiumPrice = bitcoinRate * 200;
        amount.textContent = premiumPrice;
        usd.textContent = 200;
        title.textContent = "Premium"
    } else if (package === "basicButton") {
        var basicPrice = bitcoinRate * 100;
        usd.textContent = "100";
        title.textContent = "Basic"
        amount.textContent = basicPrice;
    } else if (package === "vipButton") {
        var vipPrice = bitcoinRate * 2000;
        amount.textContent = vipPrice;
        usd.textContent = 2000;
        title.textContent = "VIP"
    }
}


//// END OF POPUP