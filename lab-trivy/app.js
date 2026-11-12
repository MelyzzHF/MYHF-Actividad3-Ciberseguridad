const e=require('express')();
e.get('/',(q,r)=>r.send('Hola'));
e.listen(3000);
