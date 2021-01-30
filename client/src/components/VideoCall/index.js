import React, { state } from "react";
import CollectUserInfo from "../CollectUserInfo";
import CallSetup from "../CallSetup";
import InCall from "../InCall";
// import AppointmentScheduling from "../AppointmentScheduling";
import "./style.css";

class VideoCall extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            compList: [],
            currentComponentIndex: 0
        };

        this.renderNextComponent = this.renderNextComponent.bind(this);
    }

    componentDidMount() {
        this.setState({...state, compList: [
            <CollectUserInfo renderNextComponent={this.renderNextComponent} />,
            <CallSetup renderNextComponent={this.renderNextComponent} />,
            <InCall renderNextComponent={this.renderNextComponent} />
        ]})
    }

    renderNextComponent() {
        if(this.state.currentComponentIndex + 1 < this.state.compList.length) {
            let index = this.state.currentComponentIndex + 1;
            this.setState({...state, currentComponentIndex: this.state.currentComponentIndex + 1});
            this.setState({...state, currentComponent: this.state.compList[this.state.currentComponentIndex]});
        }
    }

    render() {
        return (
            <div className="video-call-wrapper">
                <div className="container bg-white h-100 border rounded">
                    <div className="row h-100">
                        <div className="col-12 col-md-6 col-lg-6 m-auto h-100">
                            { this.state.compList[this.state.currentComponentIndex] }        
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
}

export default VideoCall;