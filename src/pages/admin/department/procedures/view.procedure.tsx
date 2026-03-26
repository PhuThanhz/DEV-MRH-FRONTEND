// import { Modal, Descriptions } from "antd";
// import type { IDepartmentProcedure } from "@/types/backend";

// interface IProps {
//     open: boolean;
//     onClose: () => void;
//     dataInit: IDepartmentProcedure | null;
// }

// const ViewProcedure = ({ open, onClose, dataInit }: IProps) => {

//     if (!dataInit) return null;

//     return (
//         <Modal
//             open={open}
//             title="Chi tiết quy trình"
//             onCancel={onClose}
//             footer={null}
//             width={700}
//         >
//             <Descriptions bordered column={1}>

//                 <Descriptions.Item label="Tên quy trình">
//                     {dataInit.procedureName}
//                 </Descriptions.Item>

//                 <Descriptions.Item label="Phòng ban">
//                     {dataInit.departmentName}
//                 </Descriptions.Item>

//                 <Descriptions.Item label="Bộ phận">
//                     {dataInit.sectionName}
//                 </Descriptions.Item>

//                 <Descriptions.Item label="Năm kế hoạch">
//                     {dataInit.planYear}
//                 </Descriptions.Item>

//                 <Descriptions.Item label="Trạng thái">
//                     {dataInit.status}
//                 </Descriptions.Item>

//                 <Descriptions.Item label="File">
//                     {dataInit.fileUrl}
//                 </Descriptions.Item>

//                 <Descriptions.Item label="Ghi chú">
//                     {dataInit.note}
//                 </Descriptions.Item>

//             </Descriptions>
//         </Modal>
//     );
// };

// export default ViewProcedure;