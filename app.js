const querystring = require('querystring')
const {get, set} = require('./src/db/redis')
const handleBlogRouter = require('./src/router/blog')
const {handleUserRouter, getCookieExpires} = require('./src/router/user')

// const SESSION_DATA = {}

//用于处理post data
const getPostData = (req) => {
  const promise = new Promise((resolve, reject) => {
     if (req.method !== 'POST') {
        resolve({})
        return
     }
     if (req.headers['content-type'] !== 'application/json') {
        resolve({})
        return
      }
     let postData = ''   
     req.on('data', chunk => {
      console.log(chunk,"kk")
       postData += chunk.toString()
     }) 
     req.on('end', () => {
        if(!postData) {
          resolve({})
          return
        }
        resolve(
          JSON.parse(postData)
        )
      })     
     
  })
  return promise
}


const serverHandle = (req, res) => {
   // 设置返回格式 JSON
    res.setHeader('Content-type', 'application/json')

    // 获取 path
    const url = req.url
    req.path = url.split('?')[0]

    // 解析 query
    req.query = querystring.parse(url.split('?')[1])
    console.log(req.query,"nnnn")

    // 解析 cookie
    req.cookie = {}
    const cookieStr = req.headers.cookie || ''  // k1=v1;k2=v2;k3=v3

    console.log(cookieStr,"hhhh")

    cookieStr.split(';').forEach(item => {
        if (!item) {
            return
        }
        const arr = item.split('=')
        const key = arr[0].trim()
        const val = arr[1].trim()
        req.cookie[key] = val

        console.log(req.cookie,"bbbb")
    })


  //解析 session
  // let needSetCookie = false
  // let userId = req.cookie.userid
  //  console.log(req.cookie,"kkkk2")

  // if(userId) {
  //   if(!SESSION_DATA[userId]) {
  //     SESSION_DATA[userId] = {}
  //   }    
         
  // }else {
  //     needSetCookie = true
  //     userId = `${Date.now()}_${Math.random()}`
  //     SESSION_DATA[userId] = {}
  // }

  //  req.session = SESSION_DATA[userId]
  
  // console.log('req.cookie is', SESSION_DATA[userId])

  //解析session (使用 redis)
  let needSetCookie = false
  let userId = req.cookie.userid
  if (!userId) {
    needSetCookie = true
    userId = `${Date.now()}_${Math.random()}`
    //初始化 redis 中 的session 值
    set(userId, {})
  }
  // 获取session
  req.sessionId = userId
  get(req.sessionId).then(sessionData => {
     if(sessionData == null) {
       //初始化 redis 中 的session 值
       set(req.sessionId, {})
       //设置 session
       req.session = {}
     } else {
        req.session = sessionData
     }
     console.log('req.session', req.session)

     //处理 post data
     return getPostData(req)
     
  }).then(postData => {
    req.body = postData

    //处理blog路由
    const blogResult = handleBlogRouter(req, res)
    if (blogResult) {
      blogResult.then(blogDate => {
            if (needSetCookie) {
                res.setHeader('Set-Cookie', `userid=${userId}; path=/; httpOnly; expires=${getCookieExpires()}`)
            }

         res.end(
           JSON.stringify(blogDate)
        )
      })  
      return    
    }  

      console.log("111")
      const userResult = handleUserRouter(req, res) 
      console.log("222")
      if (userResult) {
        userResult.then(userData => {

                if (needSetCookie) {
                    res.setHeader('Set-Cookie', `userid=${userId}; path=/; httpOnly; expires=${getCookieExpires()}`)
                }

          res.end(
            JSON.stringify(userData)
          )
        })
        return
      }
    

    //未命中路由 返回404
    res.writeHead(404, {"Content-type": "text/plain"})
    res.write("404 Not Found\n")
    res.end()
  })

}

module.exports = serverHandle

//env: process.env.NODE_ENV