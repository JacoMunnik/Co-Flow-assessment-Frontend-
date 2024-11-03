import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, TextField, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogActions, DialogContent, DialogTitle, Box, Snackbar, Container, Grid, Typography, Paper, TablePagination } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const baseUrl = process.env.REACT_APP_BASE_URL;

const today = new Date();
const hundredYearsAgo = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());

const validationSchema = Yup.object({
    firstName: Yup.string().required('First Name is required'),
    lastName: Yup.string().required('Last Name is required'),
    dateOfBirth: Yup.date()
        .required('Date of Birth is required')
        .max(today, 'Date of Birth cannot be in the future')
        .min(hundredYearsAgo, 'Date of Birth cannot be more than 100 years ago'),
});

const PeopleList = () => {
    const [people, setPeople] = useState([]);
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const [currentPerson, setCurrentPerson] = useState(null);
    const [age, setAge] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [personToDelete, setPersonToDelete] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        fetchPeople();
    }, [page, rowsPerPage]);

    const fetchPeople = async () => {
        try {
            const response = await axios.get(`${baseUrl}/api/people`, {
                params: {
                    page: page + 1,
                    limit: rowsPerPage,
                },
            });
            setPeople(response.data);
        } catch (error) {
            console.error('Error fetching people:', error);
        }
    };

    const handleDelete = async () => {
        if (personToDelete) {
            try {
                await axios.delete(`${baseUrl}/api/people/${personToDelete.id}`);
                fetchPeople();
                handleCloseDeleteDialog();
                showSnackbar('Person deleted successfully');
            } catch (error) {
                console.error('Error deleting person:', error);
            }
        }
    };

    const handleClickOpen = (person = null) => {
        setCurrentPerson(person);
        formik.resetForm();
        if (person) {
            formik.setValues({
                id: person.id,
                firstName: person.firstName,
                lastName: person.lastName,
                dateOfBirth: new Date(person.dateOfBirth),
            });
            setAge(calculateAge(new Date(person.dateOfBirth)));
        } else {
            setAge('');
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleOpenDeleteDialog = (person) => {
        setPersonToDelete(person);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setPersonToDelete(null);
    };

    const calculateAge = (dateOfBirth) => {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const formik = useFormik({
        initialValues: {
            id: '',
            firstName: '',
            lastName: '',
            dateOfBirth: null,
        },
        validationSchema: validationSchema,
        onSubmit: async (values) => {
            try {
                if (currentPerson) {
                    const updatePayload = {
                        id: values.id,
                        firstName: values.firstName,
                        lastName: values.lastName,
                        dateOfBirth: values.dateOfBirth,
                    };
                    console.log(`Updating person with ID: ${currentPerson.id}`);
                    await axios.put(`${baseUrl}/api/people/${currentPerson.id}`, updatePayload, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    showSnackbar('Person updated successfully');
                } else {
                    const createPayload = {
                        firstName: values.firstName,
                        lastName: values.lastName,
                        dateOfBirth: values.dateOfBirth,
                    };
                    console.log('Creating new person');
                    await axios.post(`${baseUrl}/api/people`, createPayload, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    showSnackbar('Person added successfully');
                }

                fetchPeople();
                handleClose();
            } catch (error) {
                console.error('Error saving person:', error);
                if (error.response) {
                    console.error('Response data:', error.response.data);
                    console.error('Response status:', error.response.status);
                    console.error('Response headers:', error.response.headers);
                }
            }
        },
    });

    useEffect(() => {
        if (formik.values.dateOfBirth) {
            setAge(calculateAge(formik.values.dateOfBirth));
        }
    }, [formik.values.dateOfBirth]);

    const filteredPeople = people.filter(person => {
        const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
        const searchLower = search.toLowerCase();
        return person.firstName.toLowerCase().includes(searchLower) ||
               person.lastName.toLowerCase().includes(searchLower) ||
               fullName.includes(searchLower);
    });

    const showSnackbar = (message) => {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Container maxWidth="md">
            <Box mt={4} mb={4}>
                <Typography variant="h4" gutterBottom>
                    People List
                </Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            variant="outlined"
                            size="small"
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} display="flex" justifyContent="flex-end">
                        <Button variant="contained" color="primary" onClick={() => handleClickOpen()}>
                            Add Person
                        </Button>
                    </Grid>
                </Grid>
            </Box>
            <Paper elevation={3}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>First Name</TableCell>
                            <TableCell>Last Name</TableCell>
                            <TableCell>Date of Birth</TableCell>
                            <TableCell>Age</TableCell>
                            <TableCell>Date Created</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredPeople.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(person => (
                            <TableRow key={person.id}>
                                <TableCell>{person.firstName}</TableCell>
                                <TableCell>{person.lastName}</TableCell>
                                <TableCell>{new Date(person.dateOfBirth).toLocaleDateString()}</TableCell>
                                <TableCell>{person.age}</TableCell>
                                <TableCell>{new Date(person.dateCreated).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Box display="flex" gap={1}>
                                        <Button variant="contained" color="primary" onClick={() => handleClickOpen(person)}>Edit</Button>
                                        <Button variant="contained" color="secondary" onClick={() => handleOpenDeleteDialog(person)}>Delete</Button>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={filteredPeople.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{
                        '& .MuiTablePagination-toolbar': {
                            display: 'flex',
                            justifyContent: 'space-between',
                        },
                        '& .MuiTablePagination-actions': {
                            display: 'flex',
                            alignItems: 'center',
                        },
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-input': {
                            marginRight: '16px',
                        },
                    }}
                />
            </Paper>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{currentPerson ? 'Edit Person' : 'Add New Person'}</DialogTitle>
                <DialogContent>
                    <form onSubmit={formik.handleSubmit}>
                        <TextField
                            autoFocus
                            margin="dense"
                            name="firstName"
                            label="First Name"
                            type="text"
                            fullWidth
                            value={formik.values.firstName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                            helperText={formik.touched.firstName && formik.errors.firstName}
                        />
                        <TextField
                            margin="dense"
                            name="lastName"
                            label="Last Name"
                            type="text"
                            fullWidth
                            value={formik.values.lastName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                            helperText={formik.touched.lastName && formik.errors.lastName}
                        />
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Date of Birth"
                                value={formik.values.dateOfBirth}
                                onChange={(value) => formik.setFieldValue('dateOfBirth', value)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        margin="dense"
                                        fullWidth
                                        error={formik.touched.dateOfBirth && Boolean(formik.errors.dateOfBirth)}
                                        helperText={formik.touched.dateOfBirth && formik.errors.dateOfBirth}
                                    />
                                )}
                            />
                        </LocalizationProvider>
                        <TextField
                            margin="dense"
                            name="age"
                            label="Age"
                            type="text"
                            fullWidth
                            value={age}
                            InputProps={{
                                readOnly: true,
                            }}
                        />
                        <DialogActions>
                            <Button onClick={handleClose} color="primary">
                                Cancel
                            </Button>
                            <Button type="submit" color="primary">
                                {currentPerson ? 'Update' : 'Add'}
                            </Button>
                        </DialogActions>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Delete Person</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete this person?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDelete} color="secondary">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                message={snackbarMessage}
            />
        </Container>
    );
};

export default PeopleList;
