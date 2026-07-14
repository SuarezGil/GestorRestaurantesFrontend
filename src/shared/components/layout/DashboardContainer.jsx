import { Navbar } from "./Navbar"
import { Sidebar } from "./Sidebar"
import fondoAdmin2 from "../../../assets/img/Fondo Admin 2.avif"

export const DashboardContainer = ({ children, sidebarItems }) => {
    return (
        <div
            className="min-h-screen flex flex-col font-body"
            style={{
                backgroundImage: `linear-gradient(rgba(7, 18, 34, 0.56), rgba(7, 18, 34, 0.72)), url(${fondoAdmin2})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundAttachment: "fixed",
            }}
        >
            <Navbar />
            <div className="flex flex-1">
                <Sidebar items={sidebarItems} />
                <main className="flex-1 min-w-0 p-7 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    )
}
