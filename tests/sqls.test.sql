-- comment1
select a from user where id = 1 and name = 'sss'';'; -- comment2

/*	comment3 multi \r\n lines
*
*/

   -- comment3.1
select * from user 
	where -- comment4 inline
	id = 1;

/*
	@var regexp username /[a-zA-Z]+/g
*/
select * from spk -- comment5 inline asdsad
	where
		id = ${id:int} -- @param id desc(用户ID)
	and
		-- @param name desc(用户名称) length(10,) regexp(username)
		name = ${name:string}
	and /*
		@param age desc(用户年龄) range(18,)
		*/
		age = ${age:int}
	and
		/*
		@param begin desc(起始注册时间) range(2018-01-01 00:00:00, 2018-01-02 23:59:59) format($DATETIME_LAYOUT)
		@param end desc(结束注册时间) range(2018-03-01 00:00:00, 2018-05-02 23:59:59) format($DATETIME_LAYOUT)
		*/
		createdat between (${begin:datetime}, ${end:datetime})
	and
		/*
			@param platform desc(平台) range(ios, android)
		*/
		platform = ${platform:string}
;

/*
		bbbb
*/