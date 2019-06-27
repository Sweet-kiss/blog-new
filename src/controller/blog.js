const { exec } = require('../db/mysql')

const getList = (author, keyword) => {
	let sql = `select * from blogs where 1=1 `
	if(author) {
		sql += `and author = '${author}' `
	}
	if(keyword){
		sql += `and title like '%${keyword}%'`
	}
	sql += `order by createtime desc`

	console.log(sql,"sqlcccc")

	// 返回 promise
	return exec(sql)
}

const getDetail = (id) => {
   const sql = `select * from blogs where id='${id}'`
   return exec(sql).then(rows => {
   	  return  rows[0]
   })
}

const newBlog = (blogData = {}) => {
	// blogData 是一个博客对象， 包含 title content author 属性
	const title = blogData.title
    const content = blogData.content
    const author = blogData.author

    function getNowFormatDate() {
        var date = new Date();
        var seperator1 = "-";
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var strDate = date.getDate();
        if (month >= 1 && month <= 9) {
            month = "0" + month;
        }
        if (strDate >= 0 && strDate <= 9) {
            strDate = "0" + strDate;
        }
        var currentdate = year + seperator1 + month + seperator1 + strDate;
        return currentdate;
    }


    const createtime = getNowFormatDate()

    const sql = `insert into blogs (title, content, author, createtime) 
    values ('${title}','${content}','${author}','${createtime}')`
    console.log(sql,"插入语句")

   return exec(sql).then(insertData => {
   	  console.log('insertData is', insertData)
   	  return {
   	  	 id: insertData.insertId
   	  }
   })

}

const updateBlog = (id, blogData = {}) => {
   //id 就是要更新博客的id
   // blogData 是一个博客对象， 包含 title content 属性
   const title = blogData.title
   const content = blogData.content

   const sql = `
      update blogs set title = '${title}', content = '${content}' where id = ${id}
   `
   return exec(sql).then(updateData => {
   	  console.log('updateData is', updateData)
   	  if(updateData.affectedRows > 0){
   	  	return true
   	  }
   	  return false
   })
}

const delBlog = (id, author) => {
	// id就是要删除blog的id
	const sql = `delete from blogs where id='${id}' and author='${author}'`
	return exec(sql).then(delData => {
		if(delData.affectedRows > 0) {
			return true
		}
		return false
	})
}

module.exports = {
  getList,
  getDetail,
  newBlog,
  updateBlog,
  delBlog
}