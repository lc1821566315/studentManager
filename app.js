let express = require('express');
let svgCaptcha = require('svg-captcha');
let path = require('path');
let session = require('express-session')
let bodyParser = require('body-parser')
let MongoClient = require('mongodb').MongoClient;
// mongoDB 需要使用到的 配置
// Connection URL
const url = 'mongodb://localhost:27017';
const dbName = 'studyServer';

let app = express();

// 托管静态文件
app.use(express.static('static'));
// 使用session中间件
// 每个路由的 req对象中 增加 session这个属性
// 每个路由中 多了一个 可以访问到的 session 属性 可以再他身上 保存 需要共享的属性
app.use(session({
    secret: 'keyboard cat'
  }))
// 使用body-parser中间件  对post请求的请求体进行解析
app.use(bodyParser.urlencoded({extended:false}));


// 路由一(使用get方法访问登录页面 直接读取登录页面 并返回)
app.get('/login',(req,res)=>{
    // console.log(req.session);
    // req.session.name='你来啦';
    res.sendFile(path.join(__dirname,'/static/views/login.html'));
})

// 路由二(生成图片的功能)
app.get('/login/captchaImg',(req,res)=>{
    var captcha = svgCaptcha.create();
    // console.log(captcha.text);
    // console.log(req.session.name);
    // 保存 验证码的值 到 session 方便后续的使用
    // 为了比较时简单 直接转为小写
    req.session.captcha=captcha.text.toLocaleLowerCase();
    
    res.type('svg');
    res.status(200).send(captcha.data);
})

// 路由三(使用post提交数据验证登录)
app.post('/login',(req,res)=>{
    // console.log(req);  body: { userName: '', passWord: '', code: '' },
    // 获取form表单提交的数据
    let userName = req.body.userName;
    let passWord = req.body.passWord;
    let code = req.body.code;
    // 跟session中存的数据进行比较
    if(code==req.session.captcha){
        // 验证码正确 设置session
        req.session.userinfo={
            userName,
            passWord
        }
        res.redirect('/index');
    }else{
        // 验证失败
        res.setHeader('content-type', 'text/html');
        res.send('<script>alert("验证码失败");window.location.href="/login"</script>');
    }
})

// 路由四(访问首页index)
app.get('/index',(req,res)=>{
    // 如果有session 登录了 直接访问首页
    if(req.session.userinfo){
        res.sendFile(path.join(__dirname,'/static/views/index.html'));
    }else{
        // 没有session,去登录页
        res.setHeader('content-type', 'text/html');
        res.send("<script>alert('请登录');window.location.href='/login'</script>");
    }
})

// 路由五(登出操作 删除session即可)
app.get('/logout',(req,res)=>{
    delete req.session.userinfo;
    res.redirect('/login');
})

// 路由六(展示注册页面)
app.get('/register',(req,res)=>{
    res.sendFile(path.join(__dirname,'/static/views/register.html'));
})

// 路由七(注册实现)
app.post('/register',(req,res)=>{
        // 获取用户数据
        let userName = req.body.userName;
        let passWord = req.body.passWord;
        // console.log(userName);
        // console.log(passWord);
    // 接收数据->添加到数据库->去登录页
    MongoClient.connect(url, (err, client)=> {
        //  选择使用的库
        const db = client.db(dbName);
        // 选择使用的集合
        const collection = db.collection('userlist');
        // 查询数据
        collection.find({
            userName  //快速赋值
        }).toArray((err, doc)=> {
            // console.log(doc); []
            if(doc.length==0){
                // 没有注册过,增加数据
                collection.insertOne({
                    userName,
                    passWord
                },(err,result)=>{
                    // console.log(err);
                    // 注册成功了
                    res.setHeader('content-type','text/html');
                    res.send("<script>alert('欢迎进入');window.location='/login'</script>")
                    // 关闭数据库连接即可
                    client.close();
                })
            }
          });
      });

})


app.listen(8888,'127.0.0.1',()=>{
    console.log('开启成功');
})
