const jwt = require('jsonwebtoken')
const Koa = require('koa');
const Router = require('koa-router');
const koaBody = require('koa-body');
const mongo = require('koa-mongo');
const cors = require('koa-cors');
const koaStatic = require('koa-static')
const path = require('path')
var fs = require('fs');

const app = new Koa();
const router = new Router();

app.use(mongo({
    host: '140.114.91.242',
    user: 'mongo',
    pass: 'sct2head',
    port: 38017,
    db: 'git_to_do',
}));

app.use(koaStatic(path.join(__dirname, 'avatar')))
app.use(koaBody({
    multipart: true,
    formidable: {
        uploadDir: path.join(__dirname, 'avatar'),
        keepExtensions: true,
    }
}));

app.use(cors({
    origin: '*',
    credentials: true
}));

router
    // -----------------------------------------------------USER--------------------------------------------------------- //
    // Sign in
    .post('/user/signIn', async ctx => {
        const { name } = ctx.request.body;
        const { email } = ctx.request.body;
        const { phone_number } = ctx.request.body;
        const { account } = ctx.request.body;
        const { password } = ctx.request.body;
        const { avatar_url } = ctx.request.body;
        
        if (account && password) {
            const account_exist = await ctx.db.collection('User').findOne({account: account});
            console.log(account_exist)
                
            if (account_exist) {
                if(account_exist.password === password){
                    ctx.status = 200;
                    ctx.body = account_exist._id;
                }
                else{
                    ctx.status = 303;
                }
            } else {
                // if not found, create account
                const data = await ctx.db.collection('User').insertOne({
                    name,
                    email,
                    phone_number,
                    account,
                    password,
                    avatar_url
                });

                // create new line
                const new_line = await ctx.db.collection('Line').insertOne({
                    owner: mongo.ObjectId(data.insertedId),
                    permission: false,
                    is_share: false,
                    sharerLineId: null,
                    url: null,
                    title: null,
                    content: null,
                    color_RGB: null,
                    create_date: null,
                    is_main: false,
                    contain_branch: 0
                });

                // update into userObj
                await ctx.db.collection('User').updateOne({_id: mongo.ObjectId(data.insertedId)}, {$set: {
                    name: name,
                    email: email,
                    phone_number: phone_number,
                    account: account,
                    password: password,
                    avatar_url: avatar_url,
                    todo_host: mongo.ObjectId(new_line.insertedId),
                }});

                ctx.status = 200;
                ctx.body = data.insertedId;
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
                    ctx.body = account_exist._id;
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
        const id = ctx.params.id;
        const { name } = ctx.request.body;
        const { email } = ctx.request.body;
        const { phone_number } = ctx.request.body;
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
                    phone_number: phone_number? phone_number: userObj.phone_number,
                    account: account ? account: userObj.account,
                    password: password ? password: userObj.password,
                    avatar_url: avatar_url ?  JSON.parse(avatar_url): userObj.avatar_url,
                    todo_host: mongo.ObjectId(userObj.insertedId),
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
    })

    // avatar
    router.put('/user/avatar/:userId', async ctx => {
        const userId = ctx.params.userId;
        const file = ctx.request.files.file
        const basename = path.basename(file.path)
        
        console.log(userId)
        console.log(basename)

        // File name regex
        // str = 'http://140.114.91.242:3000/upload_7030e714ae137135ee65d7bf82db99e1.jpg';
        // var re = /http:\/\/140.114.91.242:3000\/(upload_.*)/i;
        // var file_name = str.match(re)[1];
        // console.log(file_name);

        if (userId) {
            // Find corresponding user data
            const userObj = await ctx.db.collection('User').findOne({_id: mongo.ObjectId(userId)});

            if (userObj) {
                if(userObj.avatar_url){
                    var re = /http:\/\/140.114.91.242:3000\/(upload_.*)/i;
                    var file_name = userObj.avatar_url.match(re)[1];
                    console.log(file_name);
                    await fs.unlink('avatar/' + file_name, function(err) {
                        if (err) throw err;
                        console.log('file deleted');
                    });
                }
                await ctx.db.collection('User').updateOne({_id: mongo.ObjectId(userId)}, {$set: {
                    name: userObj.name,
                    email: userObj.email,
                    phone_number: userObj.phone_number,
                    account: userObj.account,
                    password: userObj.password,
                    avatar_url: `${ctx.origin}/${basename}`,
                    todo_host: userObj.todo_host,
                }});
                await ctx.db.collection('User').findOne({_id: mongo.ObjectId(userId)})
                .then((res) => {
                    // ctx.body = { "url": `${ctx.origin}/${basename}` }
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
    })

    //searchUsers
    .get('/user/searchUsers/:string/:offset/:amount', async ctx => {
        const string = ctx.params.string;
        const offset = ctx.params.offset;
        const amount = ctx.params.amount;

        console.log(string);
        console.log(offset);
        console.log(amount);

        if (string && offset && amount) {            
            var res = await ctx.db.collection('User').find({}).toArray();
            var matched_content = [];

            var re = new RegExp(`(.*)${string}(.*)`, 'i');
            for(user of res){
                if(user['name'].match(re) !== null){
                    matched_content.push(user);
                }
            }
            console.log(matched_content);
            console.log(matched_content.slice( Number(offset), Number(offset) + Number(amount)));
            ctx.body = matched_content.slice( Number(offset), Number(offset) + Number(amount));
        } else {
            ctx.status = 400;
        }
    })

    // -----------------------------------------------------LINE--------------------------------------------------------- //

    // addLine
    .post('/line/addLine', async ctx => {
        const { owner } = ctx.request.body;
        const { permission } = ctx.request.body;
        // no need to been updated here
        // const { is_share } = ctx.request.body;
        // const { sharerLineId } = ctx.request.body;
        const { url } = ctx.request.body;
        const { title } = ctx.request.body;
        const { content } = ctx.request.body;
        const { color_RGB } = ctx.request.body;
        const { create_date } = ctx.request.body;
        const { is_main } = ctx.request.body;
        // no need to been updated here
        // const { contain_branch } = ctx.request.body;

        if (owner && title && color_RGB && is_main) {
            // insert new line into DB
            const new_line = await ctx.db.collection('Line').insertOne({
                owner: mongo.ObjectId(owner),
                permission: JSON.parse(permission),
                is_share: false,
                sharerLineId: null,
                url: JSON.parse(url),
                title,
                content: JSON.parse(content),
                color_RGB: JSON.parse(color_RGB),
                create_date: (new Date(create_date)),
                is_main: JSON.parse(is_main),
                contain_branch: 0
            });
            // return inserted result
            await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(new_line.insertedId)})
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
        const { permission } = ctx.request.body;
        // no need to been updated here
        const { is_share } = ctx.request.body;
        const { sharerLineId } = ctx.request.body;
        const { url } = ctx.request.body;
        const { title } = ctx.request.body;
        const { content } = ctx.request.body;
        const { color_RGB } = ctx.request.body;
        const { create_date } = ctx.request.body;
        const { is_main } = ctx.request.body;
        // no need to been updated here
        const { contain_branch } = ctx.request.body;

        if (id) {
            // Find corresponding line data
            const lineObj = await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(id)});
            console.log(lineObj)
            if (lineObj) {
                await ctx.db.collection('Line').updateOne({_id: mongo.ObjectId(id)}, {$set: {
                    owner: owner,
                    permission: permission ? JSON.parse(permission): lineObj.permission,
                    is_share: is_share ? JSON.parse(is_share): lineObj.is_share,
                    sharerLineId: sharerLineId ? mongo.ObjectId(sharerLineId) : lineObj.sharerLineId,
                    url: url ? JSON.parse(url): lineObj.url,
                    title: title ? title: lineObj.title,
                    content: content ? JSON.parse(content): lineObj.content,
                    color_RGB: color_RGB ? JSON.parse(color_RGB): lineObj.color_RGB,
                    create_date: create_date ? (new Date(create_date)): lineObj.create_date,
                    is_main: is_main ? JSON.parse(is_main): lineObj.is_main,
                    contain_branch: contain_branch ? Number(contain_branch): lineObj.contain_branch,
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

    // -----------------------------------------------------SHARE LINE--------------------------------------------------------- //
    // shareLine
    .post('/line/shareLine', async ctx => {
        const { sharerLineId } = ctx.request.body;
        const { sharederUserId } = ctx.request.body;
        const { sharederNodeId } = ctx.request.body;

        if (sharerLineId && sharederUserId && sharederNodeId) {
            // COPY LINE
            // Find corresponding user data
            const sharerLineObj = await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(sharerLineId)});
            const sharederUserObj = await ctx.db.collection('User').findOne({_id: mongo.ObjectId(sharederUserId)});
            
            // insert new line into DB
            var currentdate = new Date(); 
            var shareder_line = await ctx.db.collection('Line').insertOne({
                owner: sharederUserObj._id,
                permission: false,
                is_share: true,
                sharerLineId: sharerLineId,
                url: sharerLineObj.url,
                title: sharerLineObj.title,
                content: sharerLineObj.content,
                color_RGB: sharerLineObj.color_RGB,
                create_date: currentdate,
                is_main: true,
                contain_branch: 0,
            });

            // update original line's 'is_share' and 'sharerLineId' attributes
            await ctx.db.collection('Line').updateOne({_id: mongo.ObjectId(sharerLineId)}, {$set: {
                owner: sharerLineObj.owner,
                permission: sharerLineObj.permission,
                is_share: true,
                sharerLineId: sharerLineId,
                url: sharerLineObj.url,
                title: sharerLineObj.title,
                content: sharerLineObj.content,
                color_RGB: sharerLineObj.color_RGB,
                create_date: sharerLineObj.create_date,
                is_main: sharerLineObj.is_main,
                contain_branch: sharerLineObj.contain_branch,
            }});

            // copy node and restore them to initial state
            var res = await ctx.db.collection('Node').find({mother_line_id: mongo.ObjectId(sharerLineId)}).toArray();
            for(node of res){
                delete node['_id'];
                node['mother_line_id'] = shareder_line.insertedId;
                node['branch_line_id'] = null;
                node['achieved'] = false;
                node['achieved_at'] = null;
            }
            await ctx.db.collection('Node').insertMany(res);

            // get new inserted result
            // var sharederLineObj = await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(shareder_line.insertedId)});

            // add branch onto shareder node

            // Find corresponding node data
            var sharederNodeObj = await ctx.db.collection('Node').findOne({_id: mongo.ObjectId(sharederNodeId)});

            // update original line
            var sharederMotherLineObj = await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(sharederNodeObj.mother_line_id)});
            sharederMotherLineObj.contain_branch = sharederMotherLineObj.contain_branch + 1;
            await ctx.db.collection('Line').updateOne({_id: mongo.ObjectId(sharederMotherLineObj._id)}, {$set: {
                owner: sharederMotherLineObj.owner,
                permission: sharederMotherLineObj.permission,
                is_share: sharederMotherLineObj.is_share,
                sharerLineId: sharederMotherLineObj.sharerLineId,
                url: sharederMotherLineObj.url,
                title: sharederMotherLineObj.title,
                content: sharederMotherLineObj.content,
                color_RGB: sharederMotherLineObj.color_RGB,
                create_date: sharederMotherLineObj.create_date,
                is_main: sharederMotherLineObj.is_main,
                contain_branch: sharederMotherLineObj.contain_branch,
            }});

            // set branch line id onto node
            sharederNodeObj.branch_line_id ? (sharederNodeObj.branch_line_id.push(shareder_line.insertedId)) : sharederNodeObj.branch_line_id = [shareder_line.insertedId];
            await ctx.db.collection('Node').updateOne({_id: mongo.ObjectId(sharederNodeId)}, {$set: {
                mother_line_id: sharederNodeObj.mother_line_id,
                branch_line_id: sharederNodeObj.branch_line_id,
                create_date: sharederNodeObj.create_date,
                due_date: sharederNodeObj.due_date,
                title: sharederNodeObj.title,
                url: sharederNodeObj.url,
                content: sharederNodeObj.content,
                achieved: sharederNodeObj.achieved,
                achieved_at: sharederNodeObj.achieved_at,
                importance: sharederNodeObj.importance,
            }});

            var shareExist = await ctx.db.collection('Share').find({sharerLineId: mongo.ObjectId(sharerLineId)}).limit(1).count();
            console.log(shareExist)
            console.log("shareExist")
            if(shareExist === 1){
                var shareObj = await ctx.db.collection('Share').findOne({sharerLineId: mongo.ObjectId(sharerLineId)});
                // shareder
                shareObj.shareder.push({shareder_user_id: mongo.ObjectId(sharederUserId), shareder_line_id: shareder_line.insertedId, shareder_progress: Number(-1)});
                
                await ctx.db.collection('Share').updateOne({_id: mongo.ObjectId(shareObj._id)}, {$set: {
                    sharerLineId: mongo.ObjectId(shareObj.sharerLineId),
                    shareder: shareObj.shareder
                }});
            }
            else{
                await ctx.db.collection('Share').insertOne({
                    sharerLineId: mongo.ObjectId(sharerLineId),
                    shareder: [{shareder_user_id: mongo.ObjectId(sharerLineObj.owner), shareder_line_id: sharerLineId, shareder_progress: Number(-1)},
                               {shareder_user_id: mongo.ObjectId(sharederUserId), shareder_line_id: shareder_line.insertedId, shareder_progress: Number(-1)}]
                });
            }
            // // return inserted result
            await ctx.db.collection('Share').findOne({sharerLineId: mongo.ObjectId(sharerLineId)})
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


    // setShareProgress
    .put('/line/setShareProgress/:sharerLineId/:sharederUserId/:sharederUserProgress', async ctx => {
        const sharerLineId = ctx.params.sharerLineId;
        const sharederUserId = ctx.params.sharederUserId;
        const sharederUserProgress = ctx.params.sharederUserProgress;

        if (sharerLineId && sharederUserId && sharederUserProgress) {
            // Find corresponding user data
            var shareObj = await ctx.db.collection('Share').findOne({sharerLineId: mongo.ObjectId(sharerLineId)});

            if (shareObj) {
                for(shareder of shareObj.shareder){
                    if(shareder['shareder_user_id'] == sharederUserId){
                        shareder['shareder_progress'] = Number(sharederUserProgress);
                    }
                }

                await ctx.db.collection('Share').updateOne({_id: mongo.ObjectId(shareObj._id)}, {$set: {
                    sharerLineId: mongo.ObjectId(shareObj.sharerLineId),
                    shareder: shareObj.shareder
                }});
                
                // return inserted result
                await ctx.db.collection('Share').findOne({sharerLineId: mongo.ObjectId(sharerLineId)})
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
    })

    // getShareProgress
    .get('/line/getShareProgress/:sharerLineId', async ctx => {
        const sharerLineId = ctx.params.sharerLineId;

        if (sharerLineId) {
            // Find corresponding user data
            await ctx.db.collection('Share').findOne({sharerLineId: mongo.ObjectId(sharerLineId)})
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

    // copyLine
    .get('/line/copyLine/:userId/:lineId', async ctx => {
        const lineId = ctx.params.lineId;
        const userId = ctx.params.userId;
        
        if (userId && lineId) {
            // Find corresponding user data
            const lineObj = await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(lineId)});
            const userObj = await ctx.db.collection('User').findOne({_id: mongo.ObjectId(userId)});
            
            var currentdate = new Date(); 
            // insert new line into DB
            const new_line = await ctx.db.collection('Line').insertOne({
                owner: userObj._id,
                permission: false,
                is_share: false,
                sharerLineId: null,
                url: lineObj.url,
                title: lineObj.title,
                content: lineObj.content,
                color_RGB: lineObj.color_RGB,
                create_date: currentdate,
                is_main: false,
                contain_branch: 0,
            });

            var res = await ctx.db.collection('Node').find({mother_line_id: mongo.ObjectId(lineId)}).toArray();
            var solid_content = [];

            for(node of res){
                delete node['_id'];
                if(node['branch_line_id'] === null){
                    node['mother_line_id'] = new_line.insertedId;
                    node['branch_line_id'] = null;
                    node['achieved'] = false;
                    node['achieved_at'] = null;
                    solid_content.push(node);
                }
            }
            
            await ctx.db.collection('Node').insertMany(solid_content);

            // return inserted result
            await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(new_line.insertedId)})
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

    // -----------------------------------------------------BRANCH LINE--------------------------------------------------------- //
    // addBranch
    .post('/line/addBranch', async ctx => {
        const { nodeId } = ctx.request.body;

        const { owner } = ctx.request.body;
        const { permission } = ctx.request.body;
        // no need to been updated here
        // const { is_share } = ctx.request.body;
        // const { sharerLineId } = ctx.request.body;
        const { url } = ctx.request.body;
        const { title } = ctx.request.body;
        const { content } = ctx.request.body;
        const { color_RGB } = ctx.request.body;
        const { create_date } = ctx.request.body;
        const { is_main } = ctx.request.body;
        // no need to been updated here
        // const { contain_branch } = ctx.request.body;

        if (owner && title && color_RGB && is_main) {
            // Find corresponding user data
            var nodeObj = await ctx.db.collection('Node').findOne({_id: mongo.ObjectId(nodeId)});

            // update original line
            var lineObj = await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(nodeObj.mother_line_id)});
            lineObj.contain_branch = lineObj.contain_branch + 1;
            await ctx.db.collection('Line').updateOne({_id: mongo.ObjectId(lineObj._id)}, {$set: {
                owner: lineObj.owner,
                permission: lineObj.permission,
                is_share: lineObj.is_share,
                sharerLineId: lineObj.sharerLineId,
                url: lineObj.url,
                title: lineObj.title,
                content: lineObj.content,
                color_RGB: lineObj.color_RGB,
                create_date: lineObj.create_date,
                is_main: lineObj.is_main,
                contain_branch: lineObj.contain_branch,
            }});

            // insert new line into DB
            const new_line = await ctx.db.collection('Line').insertOne({
                owner: mongo.ObjectId(owner),
                permission: JSON.parse(permission),
                is_share: false,
                sharerLineId: null,
                url,
                title,
                content,
                color_RGB: JSON.parse(color_RGB),
                create_date: (new Date(create_date)),
                is_main: JSON.parse(is_main),
                contain_branch: 0
            });

            // set branch line id onto node
            nodeObj.branch_line_id ? (nodeObj.branch_line_id.push(new_line.insertedId)) : nodeObj.branch_line_id = [new_line.insertedId];
            await ctx.db.collection('Node').updateOne({_id: mongo.ObjectId(nodeId)}, {$set: {
                mother_line_id: nodeObj.mother_line_id,
                branch_line_id: nodeObj.branch_line_id,
                create_date: nodeObj.create_date,
                due_date: nodeObj.due_date,
                title: nodeObj.title,
                url: nodeObj.url,
                content: nodeObj.content,
                achieved: nodeObj.achieved,
                achieved_at: nodeObj.achieved_at,
                importance: nodeObj.importance,
            }});

            // return inserted result
            await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(new_line.insertedId)})
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

    // deleteBranch
    .delete('/line/deleteBranch/:nodeId/:lineId', async ctx => {
        // 把資料分別存在 id 變數
        const nodeId = ctx.params.nodeId;
        const lineId = ctx.params.lineId;

        if (nodeId && lineId) {
            // Find corresponding branch line data and remove
            var nodeObj = await ctx.db.collection('Node').findOne({_id: mongo.ObjectId(nodeId)});
            for(idx in nodeObj.branch_line_id){
                if(nodeObj.branch_line_id[idx] == lineId){
                    nodeObj.branch_line_id.splice( idx, 1);
                    break;
                }
            }
            await ctx.db.collection('Node').updateOne({_id: mongo.ObjectId(nodeId)}, {$set: {
                mother_line_id: nodeObj.mother_line_id,
                branch_line_id: nodeObj.branch_line_id,
                create_date: nodeObj.create_date,
                due_date: nodeObj.due_date,
                title: nodeObj.title,
                url: nodeObj.url,
                content: nodeObj.content,
                achieved: nodeObj.achieved,
                achieved_at: nodeObj.achieved_at,
                importance: nodeObj.importance,
            }});

            var motherlineObj = await ctx.db.collection('Line').findOne({_id: mongo.ObjectId(nodeObj.mother_line_id)});
            motherlineObj.contain_branch = motherlineObj.contain_branch - 1;
            await ctx.db.collection('Line').updateOne({_id: mongo.ObjectId(motherlineObj._id)}, {$set: {
                owner: motherlineObj.owner,
                permission: motherlineObj.permission,
                is_share: motherlineObj.sharer,
                sharerLineId: motherlineObj.sharer_progress,
                url: motherlineObj.url,
                title: motherlineObj.title,
                content: motherlineObj.content,
                color_RGB: motherlineObj.color_RGB,
                create_date: motherlineObj.create_date,
                is_main: motherlineObj.is_main,
                contain_branch: motherlineObj.contain_branch,
            }});

            // // remove branch
            await ctx.db.collection('Line').remove({_id: mongo.ObjectId(lineId)});
            await ctx.db.collection('Node').remove({mother_line_id: mongo.ObjectId(lineId)});
            
            ctx.status = 200;

        } else {
            // 如果沒送 id，文章就不存在，就依照文件回傳 404
            ctx.status = 404;
        }
    })


    //searchBranches
    .get('/line/searchBranches/:string/:offset/:amount', async ctx => {
        const string = ctx.params.string;
        const offset = ctx.params.offset;
        const amount = ctx.params.amount;

        console.log(string);
        console.log(offset);
        console.log(amount);

        if (string && offset && amount) {            
            var res = await ctx.db.collection('Line').find({permission: true}).toArray();
            var matched_content = [];
            // File name regex
            // str = 'http://140.114.91.242:3000/10asdfupload_7030e714ae137135ee65d7bf82db99e1.jpg';
            // var re = new RegExp(`(.*)${string}(upload_.*)`);
            // console.log(re);
            // console.log(str.match(re));

            var re = new RegExp(`(.*)${string}(.*)`, 'i');
            for(line of res){
                if(line['title'].match(re) !== null){
                    matched_content.push(line);
                }
            }
            console.log(matched_content);
            console.log(matched_content.slice( Number(offset), Number(offset) + Number(amount)));
            ctx.body = matched_content.slice( Number(offset), Number(offset) + Number(amount));
        } else {
            ctx.status = 400;
        }
    })

    // -----------------------------------------------------NODE--------------------------------------------------------- //
    // addNode
    .post('/node/addNode', async ctx => {
        const { mother_line_id } = ctx.request.body;
        // const { branch_line_id } = ctx.request.body;
        const { create_date } = ctx.request.body;
        const { due_date } = ctx.request.body;
        const { title } = ctx.request.body;
        const { url } = ctx.request.body;
        const { content } = ctx.request.body;
        // const { achieved } = ctx.request.body;
        // const { achieved_at } = ctx.request.body;
        const { importance } = ctx.request.body;
        
        if (mother_line_id && create_date && due_date) {
            // insert new node into DB
            const new_node = await ctx.db.collection('Node').insertOne({
                mother_line_id: mongo.ObjectId(mother_line_id),
                branch_line_id: null,
                create_date: (new Date(create_date)),
                due_date: (new Date(due_date)),
                title,
                url: JSON.parse(url),
                content: JSON.parse(content),
                achieved: false,
                achieved_at: null,
                importance: Number(importance),
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
        // const { mother_line_id } = ctx.request.body;
        const { branch_line_id } = ctx.request.body;
        const { create_date } = ctx.request.body;
        const { due_date } = ctx.request.body;
        const { title } = ctx.request.body;
        const { url } = ctx.request.body;
        const { content } = ctx.request.body;
        const { achieved } = ctx.request.body;
        const { achieved_at } = ctx.request.body;
        const { importance } = ctx.request.body;
        console.log(branch_line_id)
        if (id) {
            const nodeObj = await ctx.db.collection('Node').findOne({_id: mongo.ObjectId(id)});
            console.log(nodeObj)
            
            if (nodeObj) {
                await ctx.db.collection('Node').updateOne({_id: mongo.ObjectId(id)}, {$set: {
                    mother_line_id: nodeObj.mother_line_id,
                    branch_line_id: branch_line_id ? JSON.parse(branch_line_id): nodeObj.branch_line_id,
                    create_date: create_date ? (new Date(create_date)): nodeObj.create_date,
                    due_date: due_date ? (new Date(due_date)): nodeObj.due_date,
                    title: title ? title: nodeObj.title,
                    url: url ? JSON.parse(url): nodeObj.url,
                    content: content ? JSON.parse(content): nodeObj.content,
                    achieved: achieved ? JSON.parse(achieved): nodeObj.achieved,
                    achieved_at: achieved_at ? (new Date(achieved_at)): nodeObj.achieved_at,
                    importance: importance ? JSON.parse(importance): nodeObj.importance,
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
                // const res = await ctx.db.collection('Node').findOne({mother_line_id: mongo.ObjectId(lineId)});
                // if(res == null){
                //     await ctx.db.collection('Line').remove({_id: mongo.ObjectId(lineId)})
                // }
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

    // -----------------------------------------------------TASK--------------------------------------------------------- //
    // addSubTask
    .post('/node/addSubTask', async ctx => {
        const { nodeId } = ctx.request.body;
        const { subtask } = ctx.request.body;
        const { done } = ctx.request.body;
        

        if (subtask && done) {
            var nodeObj = await ctx.db.collection('Node').findOne({_id: mongo.ObjectId(nodeId)});
            nodeObj.subtask ? nodeObj.subtask.push({subtask, done}) : nodeObj.subtask = [{subtask, done}]
            
            // insert new node into DB
            await ctx.db.collection('Node').updateOne({_id: mongo.ObjectId(nodeId)}, {$set: {
                mother_line_id: nodeObj.mother_line_id,
                branch_line_id: nodeObj.branch_line_id,
                create_date: nodeObj.create_date,
                due_date: nodeObj.due_date,
                title: nodeObj.title,
                url: nodeObj.url,
                content: nodeObj.content,
                achieved: nodeObj.achieved,
                achieved_at: nodeObj.achieved_at,
                importance: nodeObj.importance,
                subtask: nodeObj.subtask
            }});
            
            // return updated result
            await ctx.db.collection('Node').findOne({_id: mongo.ObjectId(nodeId)})
            .then((res) => {
                ctx.body = res;
            })
            .catch((err) => {
                ctx.status = 200;
            });
        } else {
            // 如果有欄位沒有填，就依照文件回傳 400
            ctx.status = 400;
        }
    })

    // modifySubTask
    .put('/node/modifySubTask/:nodeId', async ctx => {
        const nodeId = ctx.params.nodeId;
        const { subtaskIdx } = ctx.request.body;
        const { subtask } = ctx.request.body;
        const { done } = ctx.request.body;
        console.log(nodeId, subtaskIdx, subtask, done)

        if (nodeId && subtaskIdx && subtask && done) {
            var nodeObj = await ctx.db.collection('Node').findOne({_id: mongo.ObjectId(nodeId)});
            if(subtaskIdx < 0 || subtaskIdx >= nodeObj.subtask.length){
                ctx.status = 400;
                return;
            }
            
            nodeObj.subtask[subtaskIdx] = {subtask, done}
            // insert new node into DB
            await ctx.db.collection('Node').updateOne({_id: mongo.ObjectId(nodeId)}, {$set: {
                mother_line_id: nodeObj.mother_line_id,
                branch_line_id: nodeObj.branch_line_id,
                create_date: nodeObj.create_date,
                due_date: nodeObj.due_date,
                title: nodeObj.title,
                url: nodeObj.url,
                content: nodeObj.content,
                achieved: nodeObj.achieved,
                achieved_at: nodeObj.achieved_at,
                importance: nodeObj.importance,
                subtask: nodeObj.subtask
            }});
            
            // return updated result
            await ctx.db.collection('Node').findOne({_id: mongo.ObjectId(nodeId)})
            .then((res) => {
                ctx.body = res;
            })
            .catch((err) => {
                ctx.status = 200;
            });
        } else {
            // 如果有欄位沒有填，就依照文件回傳 400
            ctx.status = 400;
        }
    })

    // deleteSubTask
    .delete('/node/deleteSubTask/:nodeId/:subtaskIdx', async ctx => {
        const nodeId = ctx.params.nodeId;
        const subtaskIdx = ctx.params.subtaskIdx;
        
        console.log(nodeId, subtaskIdx)

        if (nodeId && subtaskIdx) {
            var nodeObj = await ctx.db.collection('Node').findOne({_id: mongo.ObjectId(nodeId)});
            if(subtaskIdx < 0 || subtaskIdx >= nodeObj.subtask.length){
                ctx.status = 400;
                return;
            }
            nodeObj.subtask.splice( subtaskIdx, 1);
            
            // insert new node into DB
            await ctx.db.collection('Node').updateOne({_id: mongo.ObjectId(nodeId)}, {$set: {
                mother_line_id: nodeObj.mother_line_id,
                branch_line_id: nodeObj.branch_line_id,
                create_date: nodeObj.create_date,
                due_date: nodeObj.due_date,
                title: nodeObj.title,
                url: nodeObj.url,
                content: nodeObj.content,
                achieved: nodeObj.achieved,
                achieved_at: nodeObj.achieved_at,
                importance: nodeObj.importance,
                subtask: nodeObj.subtask
            }});
            
            // return updated result
            await ctx.db.collection('Node').findOne({_id: mongo.ObjectId(nodeId)})
            .then((res) => {
                ctx.body = res;
            })
            .catch((err) => {
                ctx.status = 200;
            });
        } else {
            // 如果有欄位沒有填，就依照文件回傳 400
            ctx.status = 400;
        }
    });
    
app.use(router.routes());

app.listen(3000);
