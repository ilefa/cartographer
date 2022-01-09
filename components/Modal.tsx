import { Modal as RModal } from 'reactstrap';

export interface ModalProps {
    open: boolean;
    setOpen: (state: boolean) => void;
    title: string | JSX.Element;
    width?: string;
    footerButtons?: JSX.Element;
    closeIcon?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ open, setOpen, title, width, footerButtons, closeIcon, children }) => (
    <RModal className="modal-dialog-centered" isOpen={open} toggle={() => setOpen(!open)} style={{ maxWidth: width ?? '500px' }}>
        <div className="modal-header">
            <h6 className="modal-title" id="modal-title-default">{title}</h6>
            <button aria-label="Close" className="close" data-dismiss="modal" type="button" onClick={() => setOpen(false)}>
                <span aria-hidden={true}>×</span>
            </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
            {footerButtons}
            <a className="btn btn-link ml-auto text-lowercase" onClick={() => setOpen(false)}>{closeIcon && (<><i className="fa fa-times fa-fw"></i>{" "}</>)}Close</a>
        </div>
    </RModal>
)