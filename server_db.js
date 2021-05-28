const Koa = require('koa');
const Router = require('koa-router');
const koaBody = require('koa-body');
const mongo = require('koa-mongo');

const app = new Koa();
const router = new Router();

app.use(mongo({
    host: '192.168.50.170',
    port: 27017,
    db: 'git_to_do',
}))
app.use(koaBody());

router
    // -----------------------------------------------------USER--------------------------------------------------------- //
    // Sign in
    .post('/user/signIn', async ctx => {
        const { name } = ctx.request.body;
        const { email } = ctx.request.body;
        const { account } = ctx.request.body;
        const { password } = ctx.request.body;
        const { avatar_url } = ctx.request.body;
        
        if (account && password) {
            const account_exist = await ctx.db.collection('User').findOne({account: account});
            console.log(account_exist)
                
            if (account_exist) {
                if(account_exist.password === password){
                    ctx.status = 200;
                    ctx.body = 'token';
                }
                else{
                    ctx.status = 303;
                }
            } else {
                console.log("YYYYY")
                // &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&

                // main line !!!!!!!!!!!!!!!!!

                // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                // if not found, create account
                const data = await ctx.db.collection('User').insertOne({
                    name,
                    email,
                    account,
                    password,
                    avatar_url
                });
                ctx.status = 201;
                ctx.body = 'token';
            }
        } else {
            // 如果有欄位沒有填，就依照文件回傳 400
            ctx.status = 400;
        }
    })

    // logIn
    .post('/user/logIn', async ctx => {
        const { account } = ctx.request.body;
        const { password } = ctx.request.body;
        
        if (account && password) {
            const account_exist = await ctx.db.collection('User').findOne({account: account});
                
            if (account_exist) {
                if(account_exist.password === password){
                    ctx.status = 200;
                    ctx.body = 'token';
                }
                else{
                    ctx.status = 303;
                }
            } else {
                // 沒有找到的話就依照文件回傳 404
                ctx.status = 404;
            }
        } else {
            // 如果有欄位沒有填，就依照文件回傳 400
            ctx.status = 400;
        }
    })
    
    // getUser
    .get('/user/getUser/:id', async ctx => {
        const id = ctx.params.id;

        if (ctx.params.id) {
            const userObj = await ctx.db.collection('User').findOne({_id: mongo.ObjectId(id)});
            console.log(userObj)
            
            if (userObj) {
                // Success
                ctx.body = userObj;
                ctx.status = 200;
            } else {
                // Failed
                ctx.status = 404;
            }
        } else {
            // Failed
            ctx.status = 404;
        }
    })

    // modifyUser
    .put('/user/modifyUser/:id', async ctx => {
        // 把資料分別存在 id、title、body、author 等變數
        const id = ctx.params.id;
        const { name } = ctx.request.body;
        const { email } = ctx.request.body;
        const { account } = ctx.request.body;
        const { password } = ctx.request.body;
        const { avatar_url } = ctx.request.body;

        if (id) {
            // Find corresponding user data
            const userObj = await ctx.db.collection('User').findOne({_id: mongo.ObjectId(id)});
            
            if (userObj) {
                // 如果有文章的話就編輯，並依照文件回傳 204
                await ctx.db.collection('User').updateOne({_id: mongo.ObjectId(id)}, {$set: {
                    name: name ? name: userObj.name,
                    email: email ? email: userObj.email,
                    account: account ? account: userObj.account,
                    password: password ? password: userObj.password,
                    avatar_url: avatar_url ? avatar_url: userObj.avatar_url
                }});
                ctx.status = 204;                
            } else {
                // 沒有找到的話就依照文件回傳 404
                ctx.status = 404;
            }
        } else {
            // 如果有欄位沒有填，就依照文件回傳 400
            ctx.status = 400;
        }       
    })

    // addNode
    .post('/node/addNode', async ctx => {
        const { account } = ctx.request.body;
        const { password } = ctx.request.body;
        
        if (account && password) {
            const account_exist = await ctx.db.collection('User').findOne({account: account});
                
            if (account_exist) {
                if(account_exist.password === password){
                    ctx.status = 200;
                    ctx.body = 'token';
                }
                else{
                    ctx.status = 303;
                }
            } else {
                // 沒有找到的話就依照文件回傳 404
                ctx.status = 404;
            }
        } else {
            // 如果有欄位沒有填，就依照文件回傳 400
            ctx.status = 400;
        }
    })

    // -----------------------------------------------------LINE--------------------------------------------------------- //
    // getNode
    .put('/line/getNode/:id', async ctx => {
        // 把資料分別存在 id、title、body、author 等變數
        const id = ctx.params.id;
        const { name } = ctx.request.body;
        const { email } = ctx.request.body;
        const { account } = ctx.request.body;
        const { password } = ctx.request.body;
        const { avatar_url } = ctx.request.body;

        if (id) {
            // Find corresponding user data
            const userObj = await ctx.db.collection('User').findOne({_id: mongo.ObjectId(id)});
            
            if (userObj) {
                // 如果有文章的話就編輯，並依照文件回傳 204
                await ctx.db.collection('User').updateOne({_id: mongo.ObjectId(id)}, {$set: {
                    name: name ? name: userObj.name,
                    email: email ? email: userObj.email,
                    account: account ? account: userObj.account,
                    password: password ? password: userObj.password,
                    avatar_url: avatar_url ? avatar_url: userObj.avatar_url
                }});
                ctx.status = 204;                
            } else {
                // 沒有找到的話就依照文件回傳 404
                ctx.status = 404;
            }
        } else {
            // 如果有欄位沒有填，就依照文件回傳 400
            ctx.status = 400;
        }       
    })

    // modifyNode
    .get('/line/modifyNode/:id', async ctx => {
        const id = ctx.params.id;

        if (ctx.params.id) {
            const userObj = await ctx.db.collection('User').findOne({_id: mongo.ObjectId(id)});
            console.log(userObj)
            
            if (userObj) {
                // Success
                ctx.body = userObj;
                ctx.status = 200;
            } else {
                // Failed
                ctx.status = 404;
            }
        } else {
            // Failed
            ctx.status = 404;
        }
    })

    // deleteNode
    .delete('/line/deleteNode/:id', async ctx => {
        // 把資料分別存在 id 變數
        const id = ctx.params.id;
            
        if (id) {
            // 首先找出文章
            const article = await ctx.db.collection('articles').findOne({_id: mongo.ObjectId(id)});
            
            if (article) {
                // 如果有文章的話就刪除文章，然後依照文件回傳 204
                await ctx.db.collection('articles').remove({_id: mongo.ObjectId(id)});
                ctx.status = 204;
            } else {
                // 沒有找到的話就依照文件回傳 404
                ctx.status = 404;
            }
        } else {
            // 如果沒送 id，文章就不存在，就依照文件回傳 404
            ctx.status = 404;
        }    
    })
    
    // -----------------------------------------------------NODE--------------------------------------------------------- //
    // getNode
    .put('/node/getNode/:id', async ctx => {
        // 把資料分別存在 id、title、body、author 等變數
        const id = ctx.params.id;
        const { name } = ctx.request.body;
        const { email } = ctx.request.body;
        const { account } = ctx.request.body;
        const { password } = ctx.request.body;
        const { avatar_url } = ctx.request.body;

        if (id) {
            // Find corresponding user data
            const userObj = await ctx.db.collection('User').findOne({_id: mongo.ObjectId(id)});
            
            if (userObj) {
                // 如果有文章的話就編輯，並依照文件回傳 204
                await ctx.db.collection('User').updateOne({_id: mongo.ObjectId(id)}, {$set: {
                    name: name ? name: userObj.name,
                    email: email ? email: userObj.email,
                    account: account ? account: userObj.account,
                    password: password ? password: userObj.password,
                    avatar_url: avatar_url ? avatar_url: userObj.avatar_url
                }});
                ctx.status = 204;                
            } else {
                // 沒有找到的話就依照文件回傳 404
                ctx.status = 404;
            }
        } else {
            // 如果有欄位沒有填，就依照文件回傳 400
            ctx.status = 400;
        }       
    })

    // modifyNode
    .get('/node/modifyNode/:id', async ctx => {
        const id = ctx.params.id;

        if (ctx.params.id) {
            const userObj = await ctx.db.collection('User').findOne({_id: mongo.ObjectId(id)});
            console.log(userObj)
            
            if (userObj) {
                // Success
                ctx.body = userObj;
                ctx.status = 200;
            } else {
                // Failed
                ctx.status = 404;
            }
        } else {
            // Failed
            ctx.status = 404;
        }
    })

    // deleteNode
    .delete('/node/deleteNode/:id', async ctx => {
        // 把資料分別存在 id 變數
        const id = ctx.params.id;
            
        if (id) {
            // 首先找出文章
            const article = await ctx.db.collection('articles').findOne({_id: mongo.ObjectId(id)});
            
            if (article) {
                // 如果有文章的話就刪除文章，然後依照文件回傳 204
                await ctx.db.collection('articles').remove({_id: mongo.ObjectId(id)});
                ctx.status = 204;
            } else {
                // 沒有找到的話就依照文件回傳 404
                ctx.status = 404;
            }
        } else {
            // 如果沒送 id，文章就不存在，就依照文件回傳 404
            ctx.status = 404;
        }    
    });

app.use(router.routes());
app.listen(3000);
