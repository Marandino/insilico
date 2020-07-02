if (process.env.NODE_ENV !== 'production') {
    ///load all keys to heroku ****
    require('dotenv').config();
}
var express = require('express'),
    app = express(),
    ///MANAGING DATABASES
    mongoose = require('mongoose'),
    ///BODY PARSER (PARSE FORMS)
    bodyParser = require('body-parser'),
    Lesson = require('./models/lessons'),
    //// PORT
    PORT = process.env.PORT || 5000;
////CONNECT TO DATABASE
const uri = process.env.ATLAS_URI;
mongoose.set('useUnifiedTopology', true);
///removes deprecation when updoating files
mongoose.set('useFindAndModify', false);
mongoose.connect(uri, {
    useNewUrlParser: true
});

////=======
//INIT DEPENDENCIES
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

app.use(bodyParser.json());
///SET VIEW ENGINE AND PUBLIC DIR
app.set('view engine', 'ejs');
app.use(express.static('public'));

///MIDDLEWARE TO PASS THE user info to every single page
app.use(function (req, res, next) {
    // pass the user's information
    res.locals.currentUser = req.user; //passport creates this when someone's logged in
    next();
});
///
////EMAILING VARIABLES
const sgMail = require('@sendgrid/mail');
const lessons = require('./models/lessons');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
//////<

//INDEX ROUTE
app.get('/', function (req, res) {
    res.render("index");
});

/// CONTACT FORM
app.get('/contact', function (req, res) {
    res.render('contact', {
        alert: false
    });
});
app.post('/contact', function (req, res) {
    ///retrieve the email info
    const output = `
        <h3> You 've got a New Contact</h3> 
        <p> This person is trying to reach you: </p> 
        <ul>
            <li>name: ${req.body.user}</li> 
            <li>phone: ${req.body.email}</li> 
            <li>phone: ${req.body.message}</li> 
        </ul> 
    `;
    //send the email info
    const msg = {
        to: 'chiy100196@gmail.com',
        // *** change it to be customer's email
        from: 'chi@marandino.dev',
        subject: 'Insilico Customer Contact',
        text: 'null',
        html: output
    };
    sgMail.send(msg);
    ///send you back
    res.render('contact', {
        alert: 'Your Message Has Been Sent'
    });
});

////>
///LESSONS PLACEHOLDER

app.get("/lesson", (req, res) => {
    Lesson.find({}, function (err, lessons) {
        if (err) {
            console.log(err);
        } else {
            res.render('lessons', {
                lessons: lessons
            });
        }
    });
})

app.get('/lesson/:id', function (req, res) {
    var lessonsData = [];
    //request all lessons
    Lesson.find({}, function (err, lessons) {
        if (err) {
            console.log(err);
        } else {
            lessonsData.push(lessons);
            Lesson.findById(req.params.id, function (err, lesson) {
                if (err) {
                    console.log(err)
                } else {
                    lessonsData.push(lesson);
                    res.render("lesson", {
                        lessons: lessonsData[0],
                        lesson: lessonsData[1]
                    });

                }
            })
        }
    });
    // pass lesson information onto the rendered site
    // ejsout all that crap

});

//LISTEN
app.listen(PORT, () => console.log(`Listening on ${PORT}`));