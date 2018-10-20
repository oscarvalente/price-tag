import React, {Component} from "react";

import Modal, {ModalHeader, ModalBody, ModalFooter} from "../components/modal/index";

class ModalContainer extends Component {
    render() {
        return (
            <Modal>
                <ModalHeader title={this.props.title}/>
                <ModalBody message={this.props.message}/>
                <ModalFooter buttons={this.props.buttons} generateButtonCallback={this.props.generateButtonCallback}/>
            </Modal>
        )
    }
}

ModalContainer.propTypes = {
    title: ModalHeader.propTypes.title,
    message: ModalBody.propTypes.message,
    buttons: ModalFooter.propTypes.buttons,
    generateButtonCallback: ModalFooter.propTypes.generateButtonCallback
};

export default ModalContainer;
