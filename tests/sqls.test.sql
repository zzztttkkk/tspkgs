-- comment1
select a from user where id = 1 and name = 'sss'';'; -- comment2

/*	comment3 multi \r\n lines
*
*/

   -- comment3.1
select * from user 
	where -- comment4 inline
	id = 1;

   -- comment3.2
select * from spk -- comment5 inline
	where id = ${i d:int} and name = ${name:string}
	and age = ${age:int}
;
