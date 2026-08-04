import { Drawer, Descriptions } from "antd";
import { useResponsiveModalWidth } from "@/utils/responsive";

interface IProps {
    open: boolean;
    onClose: () => void;
    grade: any;
}

const DrawerRatingDetail = ({ open, onClose, grade }: IProps) => {
    const drawerWidth = useResponsiveModalWidth(550);
    if (!grade) return null;

    return (
        <Drawer
            title={`Tiêu chí – Bậc ${grade.gradeLevel}`}
            open={open}
            onClose={onClose}
            width={drawerWidth}
        >
            <Descriptions bordered column={1}>
                <Descriptions.Item label="A">
                    <pre>{grade.ratingA}</pre>
                </Descriptions.Item>
                <Descriptions.Item label="B">
                    <pre>{grade.ratingB}</pre>
                </Descriptions.Item>
                <Descriptions.Item label="C">
                    <pre>{grade.ratingC}</pre>
                </Descriptions.Item>
                <Descriptions.Item label="D">
                    <pre>{grade.ratingD}</pre>
                </Descriptions.Item>
            </Descriptions>
        </Drawer>
    );
};

export default DrawerRatingDetail;
