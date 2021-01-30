import React, { useRef, useEffect } from "react";

function DisplayAppMsg({error, info}) {

    const { msg } = error.msg || info.msg;
    const alertRef = useRef();

    useEffect(()=> {
        setTimeout(() => {
            alertRef.current.alert('close');
        }, 2000);
    }, []);

    return(
        <div 
        style={{position: "fixed", top: "5%"}}
        className="container-md">
             <div
                className={error ? "alert alert-danger text-center" : "alert alert-info text-center"} 
                role="alert"
                ref={alertRef}
                >
                    {msg}
            </div>
        </div>
       
    );
}

export default DisplayAppMsg;