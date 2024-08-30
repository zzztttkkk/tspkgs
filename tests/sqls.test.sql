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
	@regexp username /[a-zA-Z]+/g
	@paramdesc id 用户id
	@paramdesc name 用户名称
	@paramcheck name length(10,) regexp(username)
	@paramdesc age 用户年龄
	@paramcheck age range(18,)
*/
select * from spk -- comment5 inline
	where id = ${id:int} and name = ${name:string}
	and age = ${age:int}
;
