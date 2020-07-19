///express router
const express = require("express"),
  Lesson = require("../models/lessons"),
  Indicator = require("../models/indicators"),
  User = require("../models/users"),
  router = express.Router();

///LESSONS AND PRODUCTS

router.get("/lesson", (req, res) => {
  Lesson.find({}, function (err, lessons) {
    if (err) {
      console.log(err);
    } else {
      res.render("lessons", {
        lessons: lessons,
      });
    }
  });
});

router.get("/lesson/:id", function (req, res) {
  var lessonsData = [];
  //request all lessons
  Lesson.find({}, function (err, lessons) {
    if (err) {
      console.log(err);
    } else {
      lessonsData.push(lessons);
      Lesson.findById(req.params.id, function (err, lesson) {
        if (err) {
          console.log(err);
        } else {
          lessonsData.push(lesson);
          res.render("lesson", {
            lessons: lessonsData[0],
            lesson: lessonsData[1],
          });
        }
      });
    }
  });
  // pass lesson information onto the rendered site
  // ejsout all that crap
});

/// INDICATORS
router.get("/indicators", (req, res) => {
  Indicator.find({})
    .sort({ ranking: -1 })
    .exec(function (err, indicators) {
      if (err) {
        console.log(err);
        res.redirect("/");
      } else {
        const top5 = indicators.slice(0, 5);
        const top10 = indicators.slice(5, 10);
        const top20 = indicators.slice(10);
        res.render("indicators", {
          top5: top5,
          top10: top10,
          top20: top20,
        });
      }
    });
});

module.exports = router;
