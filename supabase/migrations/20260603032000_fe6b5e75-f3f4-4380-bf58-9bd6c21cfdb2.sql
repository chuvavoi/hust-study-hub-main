insert into public.books (id, title, author, cover_url, description, school, course_codes, type, total_pages, price, physical_stock) values
('11111111-1111-1111-1111-111111111111','Introduction to Programming','Nguyen Van A',null,'Foundational programming concepts in C/C++ for first-year HUST students.','SoICT','{IT3100,IT1110}','both',32,25000,5),
('22222222-2222-2222-2222-222222222222','Signals and Systems','Tran Thi B',null,'Core theory of continuous and discrete-time signals for SEEE.','SEEE','{EE2000,EE3110}','online',28,30000,0),
('33333333-3333-3333-3333-333333333333','Engineering Calculus I','Le Van C',null,'Limits, derivatives and integrals for HUST engineering programs.','FoMath','{MI1111}','both',40,20000,8),
('44444444-4444-4444-4444-444444444444','Principles of Management','Pham Thi D',null,'Introduction to management theory for the School of Economics & Management.','SME','{EM1010}','offline',0,18000,12);

insert into public.book_pages (book_id, page_number, content)
select b.id, gs,
  'Page ' || gs || ' of "' || b.title || '".' || chr(10) || chr(10) ||
  repeat('This is sample academic content for page ' || gs || '. It demonstrates the secure server-side page slicing where only the first 10 pages are returned to unauthenticated or unpaid readers. ', 6)
from public.books b
cross join generate_series(1, b.total_pages) gs
where b.total_pages > 0;