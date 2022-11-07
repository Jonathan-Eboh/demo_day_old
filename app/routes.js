const fetch = require("node-fetch")
const ObjectID = require('mongodb').ObjectID

module.exports = function (app, passport, db) {

    // normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function (req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================


    // LOGOUT ==============================
    app.get('/logout', function (req, res) {
        req.logout(() => {
            console.log('User has logged out!')
        });
        res.redirect('/');
    });

    // message board routes ===============================================================

    app.get('/cart', async (req, res) => {

        const result = await db.collection('cart').find().toArray()
        res.render('cart.ejs', { cart: result })
    })


    //https://jsonplaceholder.typicode.com/todos/


    //useing async await
    app.get('/inventory', async (req, res) => {
        const groceryResult = await fetch("https://jsonplaceholder.typicode.com/todos/") //later on put grocery api here
        let groceryJson = await groceryResult.json()
        // `https://www.thecocktaildb.com/api/json/v1/1/search.php?f=${groceryJson}`
        const drinkResult = await fetch("https://www.thecocktaildb.com/api/json/v1/1/search.php?f=a") //later on put grocery api here
        let drinkJson = await drinkResult.json()

        //slice returns new array , splice mutates it
        console.log(groceryJson.length);

        groceryJson = groceryJson.slice(0, 10)
        drinkJson = drinkJson.drinks.slice(0, 3)
        console.log(groceryJson.length);
        //const result = await db.collection('cart').find().toArray() //can use this logic structure later to loop through grocery items and try to find them in the cart, then do stuff based on that
        res.render('inventory.ejs', { inventory: groceryJson, drink: drinkJson })
    })


    //data[0]["word"]

    //profile get 
    app.get('/profile', async (req, res) => {

        const infoClusterResult = await db.collection('info_cluster').find().toArray()
        res.render('profile.ejs', { infoCluster: infoClusterResult })
    })

    //id get
    app.get('/viewCluster/:clusterId', async (req, res) => {
        console.log(req.params.clusterId);

        const infoClusterItemsResult = await db.collection('info_cluster_item').find({
            cluster_id: ObjectID(req.params.clusterId)
        }).toArray()
        console.log(infoClusterItemsResult);

        res.render('viewCluster.ejs', { infoClusterItems: infoClusterItemsResult })
    })

    //update
    app.put('/messages', (req, res) => {
        db.collection('todolist')
            .findOneAndUpdate({ name: req.body.name, msg: req.body.msg }, {
                $set: {
                    thumbUp: req.body.thumbUp + 1
                }
            }, {
                    sort: { _id: -1 },
                    upsert: true
                }, (err, result) => {
                    if (err) return res.send(err)
                    res.send(result)
                })
    })

    //create
    app.post('/todotask', (req, res) => {
        db.collection('todolist').insertOne({ task: req.body.task, priority: req.body.priority, completed: false }, (err, result) => {
            if (err) return console.log(err)
            console.log('saved to database')
            res.redirect('/')
        })
    })

    //_______________________________database logic start_____________________________

    //create a database
    app.get('/create_database', async (req, res) => {

        const infoClusterResult = await db.collection('info_cluster').find().toArray()
        res.render('create_database.ejs')
    })

    //update a database
    app.get('/update_database', async (req, res) => {

        const infoClusterResult = await db.collection('info_cluster').find().toArray()
        res.render('update_database.ejs')
    })

    //look through already existing apis
    app.get('/browse_apis', async (req, res) => {

        const infoClusterResult = await db.collection('info_cluster').find().toArray()
        res.render('browse_apis.ejs')
    })

    //_______________________________db logic end_____________________________________


    //change value of check
    app.put('/completetask', (req, res) => {
        db.collection('todolist')
            .findOneAndUpdate({ task: req.body.task }, {
                $set: {
                    // thumbUp: req.body.thumbUp + 1
                    completed: true
                }
            }, {
                    sort: { _id: -1 },
                    upsert: true
                }, (err, result) => {
                    if (err) return res.send(err)
                    res.send(result)
                })
    })

    //delete

    app.delete('/deletetask', (req, res) => {
        console.log(req.body);

        db.collection('todolist').findOneAndDelete({ task: req.body.task }, (err, result) => {
            if (err) return res.send(500, err)
            res.send('Message deleted!')
        })
    })

    // =============================================================================
    // AUTHENTICATE (FIRST LOGIN) ==================================================
    // =============================================================================

    // locally --------------------------------
    // LOGIN ===============================
    // show the login form
    app.get('/login', function (req, res) {
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // SIGNUP =================================
    // show the signup form
    app.get('/signup', function (req, res) {
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // =============================================================================
    // UNLINK ACCOUNTS =============================================================
    // =============================================================================
    // used to unlink accounts. for social accounts, just remove the token
    // for local account, remove email and password
    // user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function (req, res) {
        var user = req.user;
        user.local.email = undefined;
        user.local.password = undefined;
        user.save(function (err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
