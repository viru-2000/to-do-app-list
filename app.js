const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/toDoListDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function() {
  console.log('MongoDB connected successfully');
});

const itemSchema = {
  name: {
    type: String,
    required: [true, "Please check your data entry, 'name' should be specified!"]
  }
};

const Item = mongoose.model("Item", itemSchema);

const listSchema = {
  name: {
    type: String,
    required: [true, "Please check your data entry, 'name' should be specified!"]
  },
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, items) {
    res.render("list", { listTitle: "Today", newListItems: items });
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, list) {
    if (err) {
      console.log(err);
    } else {
      if (list) {
        res.render("list", { listTitle: customListName, newListItems: list.items });
      } else {
        const list = new List({
          name: customListName,
          items: []
        });

        list.save(function (err) {
          if (err) {
            console.log(err);
          } else {
            res.redirect("/" + customListName);
          }
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  const newItemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: newItemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, list) {
      if (err) {
        console.log(err);
      } else {
        list.items.push(item);
        list.save();
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const currentListName = req.body.listName;

  if (currentListName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted checked item from DB!");
      }
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate({ name: currentListName }, { $pull: { items: { _id: checkedItemId } } }, function (err, list) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/" + currentListName);
      }
    });
  }
});

app.listen(3000, function () {
  console.log("Server started on port: 3000");
});
