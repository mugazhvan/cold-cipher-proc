import io
from fpdf import FPDF
import qrcode

class EPassPDF(FPDF):
    def header(self):
        # Title
        self.set_font("helvetica", "B", 20)
        self.set_text_color(15, 23, 42) # Slate-900
        self.cell(0, 10, "KisanFlow", border=0, ln=1, align="C")
        
        self.set_font("helvetica", "B", 16)
        self.set_text_color(5, 150, 105) # Emerald-600
        self.cell(0, 10, "Digital Procurement e-Pass", border=0, ln=1, align="C")
        
        # Prototype disclaimer
        self.set_font("helvetica", "I", 10)
        self.set_text_color(100, 116, 139) # Slate-500
        self.cell(0, 8, "(KisanFlow Prototype - Not a government-issued document)", border=0, ln=1, align="C")
        
        self.ln(5)
        # Line break
        self.set_draw_color(226, 232, 240)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(5)

    def footer(self):
        # Position at 1.5 cm from bottom
        self.set_y(-15)
        self.set_font("helvetica", "I", 8)
        self.set_text_color(100, 116, 139)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", 0, 0, "C")

def generate_epass_pdf(
    booking_reference: str,
    token_number: str,
    farmer_name: str,
    crop_name: str,
    grade_type: str,
    quantity: str,
    centre_name: str,
    date: str,
    slot: str,
    vehicle_number: str,
    status: str,
    validity: str,
    qr_payload: str
) -> bytes:
    pdf = EPassPDF()
    pdf.alias_nb_pages()
    pdf.add_page()

    # Define content layout
    details = [
        ("Booking Reference", booking_reference),
        ("Token/Reference", token_number),
        ("Farmer Display Name", farmer_name),
        ("Crop", crop_name),
        ("Grade/Type", grade_type),
        ("Quantity", quantity),
        ("Procurement Centre", centre_name),
        ("Date", date),
        ("Slot", slot),
        ("Vehicle Number", vehicle_number),
        ("Pass Status", status),
        ("Validity", validity),
    ]

    pdf.set_y(50)

    # Print details in a structured way
    for label, value in details:
        if not value:
            value = "N/A"
            
        pdf.set_font("helvetica", "B", 12)
        self_y = pdf.get_y()
        pdf.set_text_color(71, 85, 105) # Slate-600
        pdf.cell(70, 10, f"{label}:", border=0)
        
        pdf.set_font("helvetica", "", 12)
        pdf.set_text_color(15, 23, 42) # Slate-900
        # Check if the field is pass status to highlight it
        if label == "Pass Status":
            pdf.set_font("helvetica", "B", 12)
            if value.upper() in ["CONFIRMED", "ARRIVED", "WAITING"]:
                pdf.set_text_color(5, 150, 105) # Green
            else:
                pdf.set_text_color(225, 29, 72) # Red
        
        pdf.cell(0, 10, str(value), border=0, ln=1)

    pdf.ln(15)
    
    # Embed the cryptographically signed QR payload provided by the backend
    qr = qrcode.QRCode(box_size=10, border=2)
    qr.add_data(qr_payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save QR code to bytes
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    # Draw a box for QR
    pdf.set_font("helvetica", "B", 10)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(0, 10, "OFFICIAL SCAN CODE", border=0, ln=1, align="C")
    
    # Embed QR Code into PDF
    # width is 50, center it (A4 is 210mm wide, so x = (210-50)/2 = 80)
    pdf.image(img_byte_arr, x=80, y=pdf.get_y(), w=50)

    # Output PDF as bytearray
    return bytes(pdf.output())
