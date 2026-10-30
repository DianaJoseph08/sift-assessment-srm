// Cookies authenticate staff. Signed interview links grant access only to that candidate.
const nativeFetch=window.fetch.bind(window);
window.fetch=async(input,options={})=>{
  const url=typeof input==='string'?input:input.url;
  if(url.startsWith('/api/')){
    const params=new URLSearchParams(window.location.search);
    const token=params.get('token'),candidateId=params.get('cand')||params.get('candidate');
    const headers=new Headers(options.headers || (input instanceof Request?input.headers:undefined));
    if(token && candidateId){headers.set('x-interview-token',token);headers.set('x-interview-candidate',candidateId);}
    return nativeFetch(input,{...options,headers,credentials:'same-origin'});
  }
  return nativeFetch(input,options);
};
