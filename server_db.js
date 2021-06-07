const jwt = require('jsonwebtoken')
const Koa = require('koa');
const Router = require('koa-router');
const koaBody = require('koa-body');
const mongo = require('koa-mongo');
const cors = require('koa-cors');
const koaJwt = require('koa-jwt');

const app = new Koa();
const router = new Router();

app.use(mongo({
    host: '192.168.50.170',
    port: 27017,
    db: 'git_to_do',
}));
app.use(koaBody());

function tokenValid( expire_time ){
    var currentdate = new Date(); 
    if((currentdate.getTime() - expire_time) > (60*60*1000)){
        return false;
    }
    else{
        return true;
    }
}

const koaOptions = {
  origin: '*',
  credentials: true
};

app.use(cors(koaOptions));

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
                    var token = "empty";
                    var currentdate = new Date();
                    // remove old one
                    await ctx.db.collection('Auth').remove({account: account});

                    token = jwt.sign(password, currentdate.toString());
                    await ctx.db.collection('Auth').insertOne({
                        account,
                        token,
                        expire_time: currentdate.getTime() + (60*60*1000)
                    });

                    ctx.status = 200;
                    ctx.body = token;
                }
                else{
                    ctx.status = 303;
                }
            } else {
                // if not found, create account
                const data = await ctx.db.collection('User').insertOne({
                    name,
                    email,
                    account,
                    password,
                    avatar_url
                });

                // create token
                var token = "empty";
                var currentdate = new Date();
                token = jwt.sign(password, currentdate.toString());
                await ctx.db.collection('Auth').insertOne({
                    account,
                    token,
                    expire_time: currentdate.getTime() + (60*60*1000)
                });

                ctx.status = 200;
                ctx.body = token;
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
                    var token = "empty";
                    var currentdate = new Date();
                    // remove old one
                    await ctx.db.collection('Auth').remove({account: account});

                    token = jwt.sign(password, currentdate.toString());
                    console.log(currentdate.getTime() + (60*60*1000))
                    await ctx.db.collection('Auth').insertOne({
                        account,
                        token,
                        expire_time: currentdate.getTime() + (60*60*1000)
                    });

                    ctx.status = 200;
                    ctx.body = token;
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
        // const { token } = ctx.request.header;
        // const token_exist = await ctx.db.collection('Auth').findOne({token: token});

        // if(tokenValid(token_exist.expire_time)){
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
        // }
        // else{
        //     ctx.status = 404;
        // }
    })

    // modifyUser
    .put('/user/modifyUser/:id', async ctx => {
        // const { token } = ctx.request.header;
        // const token_exist = await ctx.db.collection('Auth').findOne({token: token});

        // if(tokenValid(token_exist.expire_time)){
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
                    await ctx.db.collection('User').updateOne({_id: mongo.ObjectId(id)}, {$set: {
                        name: name ? name: userObj.name,
                        email: email ? email: userObj.email,
                        account: account ? account: userObj.account,
                        password: password ? password: userObj.password,
                        avatar_url: avatar_url ? avatar_url: userObj.avatar_url
                    }});
                    await ctx.db.collection('User').findOne({_id: mongo.ObjectId(id)})
                    .then((res) => {
                        ctx.body = res;
                    })
                    .catch((err) => {
                        ctx.status = 400;
                    });
                } else {
                    ctx.status = 404;
                }
            } else {
                ctx.status = 400;
            }
        // }
        // else{
        //     ctx.status = 400;
        // }

    })

    // -----------------------------------------------------LINE--------------------------------------------------------- //

    // addLine
    .post('/line/addLine', async ctx => {
        const { owner } = ctx.request.body;
        const { sharer } = ctx.request.body;
        const { url } = ctx.request.body;
        const { title } = ctx.request.body;
        const { content } = ctx.request.body;
        const { color_RGB } = ctx.request.body;
        const { create_date } = ctx.request.body;
        const { due_date } = ctx.request.body;
        const { importance } = ctx.request.body;
        const { is_main } = ctx.request.body;
        // no need to been updated here
        // const { contain_branch } = ctx.request.body;
        // const { branch_line_id } = ctx.request.body;    // array

        if (owner && title && color_RGB && create_date && due_date && is_main) {
            // insert new line into DB
            const new_node = await ctx.db.collection('Line').insertOne({
                owner,
                sharer,
                sharer_progress: null,
                url,
                title,
                content,
                color_RGB: JSON.parse(color_RGB),
                create_date: (new Date(create_date)),
                due_date: (new Date(due_date)),
                importance,
                is_main,
                contain_branch: false,
                branch_line_id: null
            });
            // return inserted result
            await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(new_node.insertedId)})
            .then((res) => {
                ctx.body = res;
            })
            .catch((err) => {
                ctx.status = 400;
            });
        } else {
            // 如果有欄位沒有填，就依照文件回傳 400
            ctx.status = 400;
        }
    })

    // modifyLine
    .put('/line/modifyLine/:id', async ctx => {
        const id = ctx.params.id;

        const { owner } = ctx.request.body;
        const { sharer } = ctx.request.body;
        const { url } = ctx.request.body;
        const { title } = ctx.request.body;
        const { content } = ctx.request.body;
        const { color_RGB } = ctx.request.body;
        const { create_date } = ctx.request.body;
        const { due_date } = ctx.request.body;
        const { importance } = ctx.request.body;
        const { is_main } = ctx.request.body;
        const { contain_branch } = ctx.request.body;
        const { branch_line_id } = ctx.request.body;    // array

        if (id) {
            // Find corresponding line data
            const lineObj = await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(id)});
            console.log(lineObj)
            if (lineObj) {
                await ctx.db.collection('Line').updateOne({_id: mongo.ObjectId(id)}, {$set: {
                    owner: owner,
                    sharer: sharer ? sharer: lineObj.sharer,
                    sharer_progress: sharer_progress ? sharer_progress : lineObj.sharer_progress,
                    url: url ? url: lineObj.url,
                    title: title ? title: lineObj.title,
                    content: content ? content: lineObj.content,
                    color_RGB: color_RGB ? JSON.parse(color_RGB): lineObj.color_RGB,
                    create_date: create_date ? (new Date(create_date)): lineObj.create_date,
                    due_date: due_date ? (new Date(due_date)): lineObj.due_date,
                    importance: importance ? importance: lineObj.importance,
                    is_main: is_main ? is_main: lineObj.is_main,
                    contain_branch: contain_branch ? contain_branch: lineObj.contain_branch,
                    branch_line_id: branch_line_id ? JSON.parse(branch_line_id): lineObj.branch_line_id,
                }});
                await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(id)})
                .then((res) => {
                    ctx.body = res;
                })
                .catch((err) => {
                    ctx.status = 400;
                });
            } else {
                // 沒有找到的話就依照文件回傳 404
                ctx.status = 404;
            }
        } else {
            // 如果有欄位沒有填，就依照文件回傳 400
            ctx.status = 400;
        }
    })

    // getLine
    .get('/line/getLine/:id', async ctx => {
        const id = ctx.params.id;

        if (id) {
            // Find corresponding user data
            const lineObj = await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(id)});
            
            if (lineObj) {
                ctx.body = lineObj;
                ctx.status = 200;      
            } else {
                ctx.status = 404;
            }
        } else {
            ctx.status = 400;
        }       
    })

    // setMainLine
    .put('/line/setMainLine/:userId/:lineId', async ctx => {
        const userId = ctx.params.userId;
        const lineId = ctx.params.lineId;
        if (userId && lineId) {
            // Find corresponding user data
            const userObj = await ctx.db.collection('User').findOne({_id: mongo.ObjectId(userId)});
            const lineObj = await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(lineId)});
            
            if (userObj && lineObj) {
                await ctx.db.collection('User').updateOne({_id: mongo.ObjectId(userId)}, {$set: {
                    name: userObj.name,
                    email: userObj.email,
                    account: userObj.account,
                    password: userObj.password,
                    avatar_url: userObj.avatar_url,
                    todo_main: mongo.ObjectId(lineId),
                    is_main: true
                }});
                ctx.status = 200;      
            } else {
                ctx.status = 404;
            }
        } else {
            ctx.status = 400;
        }       
    })

    // shareLine
    .put('/line/shareLine/:lineId/:userId', async ctx => {
        const lineId = ctx.params.lineId;
        const userId = ctx.params.userId;

        if (userId && lineId) {
            // Find corresponding user data
            var lineObj = await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(lineId)});
            const head_node_id = (await ctx.db.collection('Node').find({mother_line_id: mongo.ObjectId(lineId)}).sort( { due_date : 1 } ).limit(1).toArray())[0]['_id'];
            
            if(lineObj.sharer.indexOf(userId) == -1){
                lineObj.sharer ? (lineObj.sharer.push(userId)) : lineObj.sharer = [userId]
                lineObj.sharer_progress? (lineObj.sharer_progress.push(head_node_id)): lineObj.sharer_progress = [head_node_id]
            }
            if (lineObj) {
                console.log("asdf")
                await ctx.db.collection('Line').updateOne({_id: mongo.ObjectId(lineId)}, {$set: {
                    owner: lineObj.owner,
                    sharer: lineObj.sharer,
                    sharer_progress: lineObj.sharer_progress,
                    url: lineObj.url,
                    title: lineObj.title,
                    content: lineObj.content,
                    color_RGB: lineObj.color_RGB,
                    create_date: lineObj.create_date,
                    due_date: lineObj.due_date,
                    importance: lineObj.importance,
                    is_main: lineObj.is_main,
                    contain_branch: lineObj.contain_branch,
                    branch_line_id: lineObj.branch_line_id,
                }});
                
                ctx.status = 200;      
            } else {
                ctx.status = 404;
            }
        } else {
            ctx.status = 400;
        }       
    })


    // setShareProgress
    .put('/line/setShareProgress/:lineId/:userId/:nodeId', async ctx => {
        const lineId = ctx.params.lineId;
        const userId = ctx.params.userId;
        const nodeId = ctx.params.nodeId;

        if (userId && lineId && nodeId) {
            // Find corresponding user data
            var lineObj = await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(lineId)});
            
            idxOfuser = lineObj.sharer.indexOf(userId);
            if( idxOfuser == -1 ){
                ctx.status = 404;
            }{
                lineObj.sharer_progress[idxOfuser] = nodeId;
            }

            if (lineObj) {
                await ctx.db.collection('Line').updateOne({_id: mongo.ObjectId(lineId)}, {$set: {
                    owner: lineObj.owner,
                    sharer: lineObj.sharer,
                    sharer_progress: lineObj.sharer_progress,
                    url: lineObj.url,
                    title: lineObj.title,
                    content: lineObj.content,
                    color_RGB: lineObj.color_RGB,
                    create_date: lineObj.create_date,
                    due_date: lineObj.due_date,
                    importance: lineObj.importance,
                    is_main: lineObj.is_main,
                    contain_branch: lineObj.contain_branch,
                    branch_line_id: lineObj.branch_line_id,
                }});
                
                ctx.status = 200;      
            } else {
                ctx.status = 404;
            }
        } else {
            ctx.status = 400;
        }       
    })
    
    // getMainLine
    .get('/line/getMainLine/:id', async ctx => {
        const id = ctx.params.id;
        if (id) {
            // Find corresponding user data
            const userObj = await ctx.db.collection('User').findOne({_id: mongo.ObjectId(id)});
            const lineObj = await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(userObj.todo_main)});
            
            if (lineObj) {
                ctx.body = lineObj;
                ctx.status = 200;      
            } else {
                ctx.status = 404;
            }
        } else {
            ctx.status = 400;
        }       
    })

    // copyLine
    .get('/line/copyLine/:userId/:lineId', async ctx => {
        const lineId = ctx.params.lineId;
        const userId = ctx.params.userId;
        
        if (userId && lineId) {
            // Find corresponding user data
            const userObj = await ctx.db.collection('User').findOne({_id: mongo.ObjectId(userId)});
            const lineObj = await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(lineId)});
            
            var currentdate = new Date(); 
            // insert new line into DB
            const new_node = await ctx.db.collection('Line').insertOne({
                owner: userObj._id,
                sharer: null,
                url: lineObj.url,
                title: lineObj.title,
                content: lineObj.content,
                color_RGB: lineObj.color_RGB,
                create_date: currentdate,
                due_date: lineObj.due_date,
                importance: lineObj.importance,
                is_main: false,
                contain_branch: false,
                branch_line_id: null
            });

            var res = await ctx.db.collection('Node').find({mother_line_id: mongo.ObjectId(lineId)}).toArray();
            
            for(node of res){
                delete node['_id'];
                node['mother_line_id'] = new_node.insertedId;
            }

            await ctx.db.collection('Node').insertMany(res);

            // return inserted result
            await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(new_node.insertedId)})
            .then((res) => {
                ctx.body = res;
            })
            .catch((err) => {
                ctx.status = 400;
            });
        } else {
            ctx.status = 400;
        }       
    })

    //getNodesByLine
    .get('/line/getNodesByLine/:lineId/:offset/:amount/:sortby', async ctx => {
        const lineId = ctx.params.lineId;
        const offset = ctx.params.offset;
        const amount = ctx.params.amount;
        var sortby = ctx.params.sortby;

        console.log(lineId);
        console.log(offset);
        console.log(amount);
        console.log(sortby);

        if (lineId && offset && amount && sortby) {
            // translate sortby
            if(sortby == 0)
                sortby = 1;
            else
                sortby = -1;
            
            var res = await ctx.db.collection('Node').find({mother_line_id: mongo.ObjectId(lineId)}).sort( { due_date : sortby } ).skip(Number(offset)).limit(Number(amount)).toArray();

            ctx.body = res;
        } else {
            ctx.status = 400;
        }       
    })

    // deleteLine
    .delete('/line/deleteLine/:lineId', async ctx => {
        // 把資料分別存在 id 變數
        const lineId = ctx.params.lineId;

        if (lineId) {
            const lineObj = await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(lineId)});
            console.log(lineObj)
            if (lineObj) {
                await ctx.db.collection('Line').remove({_id: mongo.ObjectId(lineId)});
                await ctx.db.collection('Node').remove({mother_line_id: mongo.ObjectId(lineId)});
                ctx.status = 200;      
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
    // addNode
    .post('/node/addNode', async ctx => {
        const { is_main } = ctx.request.body;
        const { mother_line_id } = ctx.request.body;
        // const { branch_line_id } = ctx.request.body;
        const { create_date } = ctx.request.body;
        const { due_date } = ctx.request.body;
        const { title } = ctx.request.body;
        const { url } = ctx.request.body;
        const { content } = ctx.request.body;
        
        if (is_main && mother_line_id && create_date && due_date && content) {
            // insert new node into DB
            const new_node = await ctx.db.collection('Node').insertOne({
                is_main,
                mother_line_id: mongo.ObjectId(mother_line_id),
                branch_line_id: null,
                create_date: (new Date(create_date)),
                due_date: (new Date(due_date)),
                title,
                url,
                content,
                achieved: false,
                achieved_at: null
            });
            // return inserted result
            await ctx.db.collection('Node').findOne({_id: mongo.ObjectId(new_node.insertedId)})
            .then((res) => {
                ctx.body = res;
            })
            .catch((err) => {
                ctx.status = 400;
            });
        } else {
            // 如果有欄位沒有填，就依照文件回傳 400
            ctx.status = 400;
        }
    })

    // getNode
    .get('/node/getNode/:id', async ctx => {
        const id = ctx.params.id;

        if (id) {
            // Find corresponding user data
            const nodeObj = await ctx.db.collection('Node').findOne({_id: mongo.ObjectId(id)});
            
            if (nodeObj) {
                ctx.body = nodeObj;
                ctx.status = 200;      
            } else {
                ctx.status = 404;
            }
        } else {
            ctx.status = 400;
        }       
    })

    // modifyNode
    .put('/node/modifyNode/:id', async ctx => {
        const id = ctx.params.id;
        const { is_main } = ctx.request.body;
        // const { mother_line_id } = ctx.request.body;
        // const { branch_line_id } = ctx.request.body;
        const { create_date } = ctx.request.body;
        const { due_date } = ctx.request.body;
        const { title } = ctx.request.body;
        const { url } = ctx.request.body;
        const { content } = ctx.request.body;

        if (id) {
            const nodeObj = await ctx.db.collection('Node').findOne({_id: mongo.ObjectId(id)});
            console.log(nodeObj)
            
            if (nodeObj) {        
                await ctx.db.collection('Node').updateOne({_id: mongo.ObjectId(id)}, {$set: {
                    is_main: is_main ? is_main: nodeObj.is_main,
                    mother_line_id: mongo.ObjectId(nodeObj.mother_line_id),
                    branch_line_id: mongo.ObjectId(nodeObj.branch_line_id),
                    create_date: create_date ? (new Date(create_date)): nodeObj.create_date,
                    due_date: due_date ? (new Date(due_date)): nodeObj.due_date,
                    title: title ? title: nodeObj.title,
                    url: url ? url: nodeObj.url,
                    content: content ? content: nodeObj.content,
                    achieved: achieved ? achieved: nodeObj.achieved,
                    achieved_at: achieved_at ? achieved_at: nodeObj.achieved_at,
                }});

                await ctx.db.collection('Node').findOne({_id: mongo.ObjectId(id)})
                .then((res) => {
                    ctx.body = res;
                })
                .catch((err) => {
                    ctx.status = 400;
                });
            } else {
                // Failed
                ctx.status = 404;
            }
        } 
        else {
            // Failed
            ctx.status = 404;
        }

    })

    // deleteNode
    .delete('/node/deleteNode/:lineId/:nodeId', async ctx => {
        // 把資料分別存在 id 變數
        const lineId = ctx.params.lineId;
        const nodeId = ctx.params.nodeId;

        if (lineId && nodeId) {
            const nodeObj = await ctx.db.collection('Node').findOne({_id: mongo.ObjectId(nodeId)});
            
            if (nodeObj) {
                await ctx.db.collection('Node').remove({_id: mongo.ObjectId(nodeId)});
                const res = await ctx.db.collection('Node').findOne({mother_line_id: mongo.ObjectId(lineId)});
                if(res == null){
                    await ctx.db.collection('Line').remove({_id: mongo.ObjectId(lineId)})
                }
                ctx.status = 200;
            } else {
                // 沒有找到的話就依照文件回傳 404
                ctx.status = 404;
            }
        } else {
            // 如果沒送 id，文章就不存在，就依照文件回傳 404
            ctx.status = 404;
        }    
    });
app.use( async (ctx, next) => {
    console.log(ctx.header.authorization)
    // if (ctx.header && ctx.header.authorization) {
    //     const parts = ctx.header.authorization.split(' ');
    //     if (parts.length === 2) {
    //     //取出token
    //     const scheme = parts[0];
    //     const token = parts[1];
        
    //     if (/^Bearer$/i.test(scheme)) {
    //         try {
    //             //jwt.verify方法验证token是否有效
    //             jwt.verify(token, secret.sign, {
    //                 complete: true
    //             });
    //         } catch (error) {
    //             //token过期 生成新的token
    //             const newToken = getToken(user);
    //             //将新token放入Authorization中返回给前端
    //             ctx.res.setHeader('Authorization', newToken);
    //         }
    //     }
    //     }
    // }

    return next();
});

// //路由权限控制 除了path里的路径不需要验证token 其他都要
// app.use(
//     koaJwt({
//         secret: 'my_app_secret'
//     }).unless({
//         path: [/^\/logIn/, /^\/signIn/]
//     })
// );
app.use(router.routes());



app.listen(3000);
