import React from "react";

function CollectUserInfo({ renderNextComponent }) {

    function handleFormSubmit(e) {
        e.preventDefault();
        renderNextComponent();
    }

    return (
        <form className="row bg-white h-100">
            
            <p className="px-3 mt-3">Please Provide your information</p>

            {/* full name */}
            <div className="mb-3 col-12">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control" placeholder="John Doe" />
            </div>
            {/* phone number */}
            <div className="mb-3 col-12">
                <label className="form-label">Phone Number:</label>
                <input type="number" className="form-control" placeholder="4434434434" />
            </div>
            {/* subject */}
            <div className="mb-3 col-12">
                <label className="form-label">Subject</label>
                <input type="text" className="form-control"  placeholder="Enter your subject" />
            </div>
            {/* message */}
            <div className="mb-3 col-12">
                <label className="form-label">Message: *</label>
                <textarea className="form-control" rows="3" placeholder="Your mesage"></textarea>
            </div>
            <div className="col-auto ml-auto">
                <button className="btn btn-danger mb-3 mx-2">Cancel</button>
                <button type="submit" className="btn btn-primary mb-3" onClick={handleFormSubmit}>Setup Call</button>
            </div>
        </form>
    );
}

export default CollectUserInfo;