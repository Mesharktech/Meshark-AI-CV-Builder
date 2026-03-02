import { useState } from 'react';
import { auth } from '../firebase';

export function useCV(user) {
    const [pdfBlob, setPdfBlob] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [showPdfModal, setShowPdfModal] = useState(false);

    const [coverLetterUrl, setCoverLetterUrl] = useState(null);
    const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);

    const [atsScore, setAtsScore] = useState(null);
    const [isFetchingAts, setIsFetchingAts] = useState(false);

    const [isSendingEmail, setIsSendingEmail] = useState(false);

    const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const getToken = async () => auth.currentUser ? await auth.currentUser.getIdToken() : null;

    const generatePdf = async (data, templateConfig, setMessages, formatTime) => {
        setIsGeneratingPdf(true);
        try {
            const url = getApiUrl();
            const token = await getToken();
            const response = await fetch(`${url}/api/generate_pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    cv_data: data,
                    template_name: templateConfig.templateId,
                    color: templateConfig.color
                })
            });
            if (!response.ok) throw new Error('PDF Generation failed');
            const blob = await response.blob();
            setPdfUrl(prev => {
                if (prev) window.URL.revokeObjectURL(prev);
                return window.URL.createObjectURL(blob);
            });
            setPdfBlob(blob);
            setShowPdfModal(true);
            fetchAtsScore(data, templateConfig);
        } catch (err) {
            console.error(err);
            if (setMessages && formatTime) {
                setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Oops, I failed to generate the PDF. Please try again.', timestamp: formatTime() }]);
            }
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleDownload = () => {
        if (!pdfUrl) return;
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = 'Meshark_AI_CV.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const generateCoverLetter = async (cvData, jobDescription) => {
        if (!cvData || !user) return;
        setIsGeneratingCoverLetter(true);
        try {
            const url = getApiUrl();
            const token = await getToken();
            const response = await fetch(`${url}/api/generate_cover_letter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    cv_data: cvData,
                    job_description: jobDescription,
                    company_name: '',
                    hiring_manager: 'Hiring Manager'
                })
            });
            if (!response.ok) throw new Error('Cover letter generation failed');
            const blob = await response.blob();
            const newUrl = window.URL.createObjectURL(blob);
            setCoverLetterUrl(newUrl);
            const a = document.createElement('a');
            a.href = newUrl;
            a.download = 'Meshark_Cover_Letter.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            console.error(err);
            alert('Sorry, I could not generate a cover letter right now.');
        } finally {
            setIsGeneratingCoverLetter(false);
        }
    };

    const fetchAtsScore = async (data, templateConfig) => {
        if (!data || !user) return;
        setIsFetchingAts(true);
        setAtsScore(null);
        try {
            const url = getApiUrl();
            const token = await getToken();
            const res = await fetch(`${url}/api/ats_score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    cv_data: data,
                    template_name: templateConfig?.templateId || 'colorful',
                    color: templateConfig?.color || '0056b3'
                })
            });
            if (!res.ok) throw new Error('ATS scoring failed');
            setAtsScore(await res.json());
        } catch (err) {
            console.error('ATS score error:', err);
        } finally {
            setIsFetchingAts(false);
        }
    };

    const sendCvEmail = async (cvData, selectedTemplateConfig) => {
        if (!cvData || !user || !selectedTemplateConfig) return;
        setIsSendingEmail(true);
        try {
            const url = getApiUrl();
            const token = await getToken();
            const res = await fetch(`${url}/api/send_cv_email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    cv_data: cvData,
                    template_name: selectedTemplateConfig.templateId,
                    color: selectedTemplateConfig.color
                })
            });
            if (!res.ok) throw new Error('Email failed');
            alert('CV sent to your email! 📧');
        } catch (err) {
            console.error(err);
            alert('Failed to send email. Please try again.');
        } finally {
            setIsSendingEmail(false);
        }
    };

    return {
        pdfBlob, setPdfBlob,
        pdfUrl, setPdfUrl,
        isGeneratingPdf,
        showPdfModal, setShowPdfModal,
        coverLetterUrl,
        isGeneratingCoverLetter,
        atsScore, setAtsScore,
        isFetchingAts,
        isSendingEmail,
        generatePdf,
        handleDownload,
        generateCoverLetter,
        fetchAtsScore,
        sendCvEmail
    };
}
